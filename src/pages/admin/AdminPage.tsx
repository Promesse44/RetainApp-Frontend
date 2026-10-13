import { useEffect, useState } from 'react'
import { adminApi, categoryApi } from '../../api'
import type { AdminInsights, Category } from '../../types'

type InsightExpense = AdminInsights['recentExpenses'][number] & {
	user: { id: string; name: string; email: string }
}

function fmt(n: number) {
	return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function dateLabel(value: string) {
	return new Date(value).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

export function AdminPage() {
	const [insights, setInsights] = useState<AdminInsights | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [name, setName] = useState('')
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')

	async function load() {
		setLoading(true)
		setError('')
		try {
			const [insightsRes, categoriesRes] = await Promise.all([
				adminApi.insights(),
				categoryApi.list(),
			])
			setInsights(insightsRes.data)
			setCategories(categoriesRes.data)
		} catch {
			setError('Failed to load admin data.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		load()
	}, [])

	useEffect(() => {
		if (!notice) return
		const timer = setTimeout(() => setNotice(''), 2500)
		return () => clearTimeout(timer)
	}, [notice])

	function startEdit(category: Category) {
		setEditingCategoryId(category.id)
		setName(category.name)
	}

	function resetForm() {
		setEditingCategoryId(null)
		setName('')
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const trimmed = name.trim()
		if (!trimmed) return

		setSaving(true)
		setError('')
		try {
			if (editingCategoryId) {
				await adminApi.updateCategory(editingCategoryId, trimmed)
				setNotice('Category updated.')
			} else {
				await adminApi.createCategory(trimmed)
				setNotice('Category created.')
			}
			resetForm()
			await load()
		} catch (err: any) {
			setError(err?.response?.data?.error ?? 'Failed to save category.')
		} finally {
			setSaving(false)
		}
	}

	async function handleDelete(category: Category) {
		if (category.isDefault) return
		if (!window.confirm(`Delete "${category.name}"? Expenses in this category will be moved to the default category.`)) return

		setSaving(true)
		setError('')
		try {
			await adminApi.deleteCategory(category.id)
			if (editingCategoryId === category.id) resetForm()
			setNotice('Category deleted.')
			await load()
		} catch (err: any) {
			setError(err?.response?.data?.error ?? 'Failed to delete category.')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Loading…</div>
	}

	if (!insights) {
		return <div className="flex items-center justify-center h-64 text-red-500 text-sm">No admin data available.</div>
	}

	const topValue = Math.max(...Object.values(insights.spendingByCategory), 1)

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div>
				<h1 style={{ fontFamily: 'Sora, sans-serif' }} className="text-2xl font-bold text-zinc-900">Admin Panel</h1>
				<p className="text-sm text-zinc-500 mt-1">Manage categories and review platform insights.</p>
			</div>

			{error && <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}
			{notice && <div className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{notice}</div>}

			<div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6">
				<section className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4 h-fit">
					<div>
						<h2 className="text-sm font-semibold text-zinc-900">Category management</h2>
						<p className="text-xs text-zinc-400 mt-1">Create, rename, or delete categories. Deleting a category moves its expenses to the default category.</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-3">
						<div>
							<label className="block text-xs font-medium text-zinc-600 mb-1">Category name</label>
							<input
								value={name}
								onChange={e => setName(e.target.value)}
								placeholder="e.g. Utilities"
								className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
							/>
						</div>
						<div className="flex gap-2">
							<button
								type="submit"
								disabled={saving || !name.trim()}
								className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
							>
								{saving ? 'Saving…' : editingCategoryId ? 'Update category' : 'Create category'}
							</button>
							{editingCategoryId && (
								<button
									type="button"
									onClick={resetForm}
									className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
								>
									Cancel
								</button>
							)}
						</div>
					</form>

					<div className="space-y-2 pt-2">
						{categories.map(category => (
							<div key={category.id} className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-zinc-100">
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<p className="text-sm font-medium text-zinc-800 truncate">{category.name}</p>
										{category.isDefault && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">Default</span>}
									</div>
									<p className="text-xs text-zinc-400">{dateLabel(category.createdAt)}</p>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<button
										type="button"
										onClick={() => startEdit(category)}
										className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition"
									>
										Edit
									</button>
									<button
										type="button"
										disabled={category.isDefault}
										onClick={() => handleDelete(category)}
										className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				</section>

				<section className="space-y-6">
					<div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
						<StatCard label="Registered users" value={String(insights.totalUsers)} />
						<StatCard label="Expenses recorded" value={String(insights.totalExpenses)} />
						<StatCard label="Expenses this month" value={String(insights.monthExpensesCount)} />
						<StatCard label="Total value" value={`$${fmt(insights.totalValue)}`} />
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
							<h2 className="text-sm font-semibold text-zinc-900">Spending per category</h2>
							{Object.keys(insights.spendingByCategory).length === 0 ? (
								<p className="text-sm text-zinc-400">No expense data yet.</p>
							) : (
								<div className="space-y-3">
									{Object.entries(insights.spendingByCategory)
										.sort((a, b) => b[1] - a[1])
										.map(([category, amount]) => (
											<div key={category}>
												<div className="flex items-center justify-between text-sm mb-1">
													<span className="text-zinc-700">{category}</span>
													<span className="text-zinc-500">${fmt(amount)}</span>
												</div>
												<div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
													<div className="h-full rounded-full bg-emerald-500" style={{ width: `${(amount / topValue) * 100}%` }} />
												</div>
											</div>
										))}
								</div>
							)}
						</div>

						<div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
							<h2 className="text-sm font-semibold text-zinc-900">Most and least used categories</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<InsightList title="Top 5" items={insights.top5Categories} />
								<InsightList title="Bottom 5" items={insights.bottom5Categories} />
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
							<h2 className="text-sm font-semibold text-zinc-900">Recently added expenses</h2>
							{insights.recentExpenses.length === 0 ? (
								<p className="text-sm text-zinc-400">No recent expenses.</p>
							) : (
								<div className="space-y-3">
									{insights.recentExpenses.map(expense => (
										<div key={expense.id} className="flex items-center justify-between gap-4">
											<div className="min-w-0">
												<p className="text-sm text-zinc-800 truncate">{expense.title}</p>
												<p className="text-xs text-zinc-400 truncate">
													{expense.category.name} · {(expense as InsightExpense).user.name} · {dateLabel(expense.createdAt)}
												</p>
											</div>
											<span className="text-sm font-semibold text-zinc-900 shrink-0">${fmt(expense.amount)}</span>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
							<h2 className="text-sm font-semibold text-zinc-900">Recently registered users</h2>
							{insights.recentUsers.length === 0 ? (
								<p className="text-sm text-zinc-400">No users yet.</p>
							) : (
								<div className="space-y-3">
									{insights.recentUsers.map(user => (
										<div key={user.id} className="flex items-center justify-between gap-4">
											<div>
												<p className="text-sm text-zinc-800">{user.name}</p>
												<p className="text-xs text-zinc-400">{user.email} · {user.role}</p>
											</div>
											<span className="text-xs text-zinc-400 shrink-0">{dateLabel(user.createdAt)}</span>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-white rounded-2xl border border-zinc-100 p-5">
			<p className="text-xs text-zinc-400 mb-1">{label}</p>
			<p style={{ fontFamily: 'Sora, sans-serif' }} className="text-2xl font-bold text-zinc-900">{value}</p>
		</div>
	)
}

function InsightList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
	return (
		<div>
			<p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">{title}</p>
			<div className="space-y-2">
				{items.length === 0 ? (
					<p className="text-sm text-zinc-400">No data.</p>
				) : items.map(item => (
					<div key={item.name} className="flex items-center justify-between text-sm">
						<span className="text-zinc-700 truncate pr-3">{item.name}</span>
						<span className="text-zinc-500 shrink-0">{item.count}</span>
					</div>
				))}
			</div>
		</div>
	)
}
