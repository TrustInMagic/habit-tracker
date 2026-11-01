'use client';

import { useState, useEffect, useTransition } from 'react';
import { Month, GoalCategory } from '@prisma/client';
import {
  getMonths,
  createMonth,
  deleteMonth,
  updateGoal,
  addCustomGoal,
  deleteGoal,
} from './actions';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Award,
} from 'lucide-react';

type MonthWithGoals = Month & { goals: GoalCategory[] };

export default function Dashboard() {
  const [months, setMonths] = useState<MonthWithGoals[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMonthName, setNewMonthName] = useState('');
  const [newMonthYear, setNewMonthYear] = useState(2026);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getMonths();
    setMonths(data as MonthWithGoals[]);
  }

  const handleAddMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthName.trim()) return;

    startTransition(async () => {
      const res = await createMonth(newMonthName, Number(newMonthYear));
      if (res.success) {
        setNewMonthName('');
        setIsModalOpen(false);
        loadData();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDeleteMonth = async (id: string) => {
    if (
      !confirm('Are you sure you want to delete this month and all its goals?')
    )
      return;
    startTransition(async () => {
      await deleteMonth(id);
      setActiveTab('dashboard');
      loadData();
    });
  };

  const chartData = months.map((m) => {
    const total = calculateMonthTotal(m.goals);
    return { name: m.name, progress: total };
  });

  const activeMonth = months.find((m) => m.id === activeTab);

  return (
    <main className='min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans selection:bg-indigo-500 selection:text-white pb-16'>
      {/* Top Header */}
      <header className='border-b border-neutral-800 bg-[#121216]/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20'>
            <TrendingUp className='w-5 h-5' />
          </div>
          <div>
            <h1 className='text-lg font-bold tracking-tight text-white'>
              Apex Goals
            </h1>
            <p className='text-xs text-neutral-400'>
              Personal Performance & Habit Tracker
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className='flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30 active:scale-95'
        >
          <Plus className='w-4 h-4' />
          <span>Add Month</span>
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className='max-w-7xl mx-auto px-6 mt-6 flex space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-800'>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/60'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <TrendingUp className='w-4 h-4 text-indigo-400' />
          <span>General Dashboard</span>
        </button>

        {months.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveTab(m.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === m.id
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Calendar className='w-4 h-4 text-emerald-400' />
            <span>{m.name}</span>
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className='max-w-7xl mx-auto px-6 mt-8'>
        {activeTab === 'dashboard' ? (
          <GeneralDashboard
            months={months}
            chartData={chartData}
            onSelectMonth={(id) => setActiveTab(id)}
          />
        ) : (
          <MonthDetail
            month={activeMonth}
            onUpdate={loadData}
            onDelete={() => handleDeleteMonth(activeTab)}
          />
        )}
      </div>

      {/* Add Month Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-[#16161c] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200'>
            <h2 className='text-xl font-bold text-white mb-2'>
              Track New Month
            </h2>
            <p className='text-sm text-neutral-400 mb-6'>
              Initialize a new month with default goals ready for tracking.
            </p>

            <form onSubmit={handleAddMonth} className='space-y-4'>
              <div>
                <label className='block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2'>
                  Month Name
                </label>
                <input
                  type='text'
                  placeholder='e.g., January or January 2026'
                  value={newMonthName}
                  onChange={(e) => setNewMonthName(e.target.value)}
                  className='w-full bg-[#1e1e26] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition'
                  required
                />
              </div>

              <div>
                <label className='block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2'>
                  Year
                </label>
                <input
                  type='number'
                  value={newMonthYear}
                  onChange={(e) => setNewMonthYear(Number(e.target.value))}
                  className='w-full bg-[#1e1e26] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition'
                  required
                />
              </div>

              <div className='flex justify-end space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isPending}
                  className='px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/30 transition disabled:opacity-50'
                >
                  {isPending ? 'Creating...' : 'Create Month'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

interface GeneralDashboardProps {
  months: MonthWithGoals[];
  chartData: { name: string; progress: number }[];
  onSelectMonth: (id: string) => void;
}

function GeneralDashboard({
  months,
  chartData,
  onSelectMonth,
}: GeneralDashboardProps) {
  const avgProgress =
    months.length > 0
      ? Math.round(
          months.reduce((acc, m) => acc + calculateMonthTotal(m.goals), 0) /
            months.length,
        )
      : 0;

  return (
    <div className='space-y-8'>
      {/* Stats Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-[#121216] border border-neutral-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-neutral-400'>
              Total Tracked Months
            </span>
            <Calendar className='w-5 h-5 text-indigo-400' />
          </div>
          <div className='mt-4 flex items-baseline'>
            <span className='text-3xl font-extrabold text-white'>
              {months.length}
            </span>
            <span className='ml-2 text-xs text-neutral-500'>
              Active records
            </span>
          </div>
        </div>

        <div className='bg-[#121216] border border-neutral-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-neutral-400'>
              Average Yearly Progress
            </span>
            <Award className='w-5 h-5 text-emerald-400' />
          </div>
          <div className='mt-4 flex items-baseline'>
            <span className='text-3xl font-extrabold text-white'>
              {avgProgress}%
            </span>
            <span className='ml-2 text-xs text-emerald-400 font-medium'>
              Overall efficiency
            </span>
          </div>
        </div>

        <div className='bg-[#121216] border border-neutral-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-neutral-400'>
              Core Goals Tracked
            </span>
            <CheckCircle2 className='w-5 h-5 text-amber-400' />
          </div>
          <div className='mt-4 flex items-baseline'>
            <span className='text-3xl font-extrabold text-white'>
              7 Categories
            </span>
            <span className='ml-2 text-xs text-neutral-500'>Per month</span>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className='bg-[#121216] border border-neutral-800/80 rounded-2xl p-6 shadow-xl'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-lg font-bold text-white'>
              Annual Progress Overview
            </h2>
            <p className='text-xs text-neutral-400'>
              Monthly aggregate percentage plotted over time
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className='h-64 flex flex-col items-center justify-center text-neutral-500 space-y-2'>
            <Calendar className='w-8 h-8 opacity-40' />
            <p className='text-sm'>
              No months added yet. Click Add Month to begin.
            </p>
          </div>
        ) : (
          <div className='h-72 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#22222b' />
                <XAxis
                  dataKey='name'
                  stroke='#71717a'
                  textAnchor='end'
                  fontSize={12}
                />
                <YAxis
                  stroke='#71717a'
                  domain={[0, 100]}
                  fontSize={12}
                  unit='%'
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181820',
                    borderColor: '#2d2d3a',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='progress'
                  stroke='#6366f1'
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Month Cards Grid */}
      <div>
        <h2 className='text-lg font-bold text-white mb-4'>Your Months</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {months.map((m) => {
            const total = calculateMonthTotal(m.goals);
            return (
              <div
                key={m.id}
                onClick={() => onSelectMonth(m.id)}
                className='bg-[#121216] border border-neutral-800 hover:border-indigo-500/50 transition cursor-pointer rounded-2xl p-5 shadow-lg group flex flex-col justify-between'
              >
                <div>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-sm font-semibold text-white group-hover:text-indigo-400 transition'>
                      {m.name}
                    </span>
                    <span className='text-xs bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-lg font-medium'>
                      {total}% Achieved
                    </span>
                  </div>
                  <div className='w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-4'>
                    <div
                      className='bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500'
                      style={{ width: `${Math.min(total, 100)}%` }}
                    />
                  </div>
                </div>
                <div className='flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-neutral-800/60'>
                  <span>{m.goals.length} categories tracked</span>
                  <span className='text-indigo-400 font-medium group-hover:underline'>
                    View details &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface MonthDetailProps {
  month?: MonthWithGoals;
  onUpdate: () => void;
  onDelete: () => void;
}

function MonthDetail({
  month,
  onUpdate,
  onDelete,
}: {
  month?: MonthWithGoals;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalUnit, setGoalUnit] = useState('days');
  const [goalExpected, setGoalExpected] = useState(10);
  const [isPending, startTransition] = useTransition();

  if (!month) return null;

  const monthTotal = calculateMonthTotal(month.goals);

  const handleGoalChange = async (
    goalId: string,
    expected: number,
    achieved: number,
  ) => {
    await updateGoal(goalId, expected, achieved);
    onUpdate();
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) return;

    startTransition(async () => {
      const res = await addCustomGoal(
        month.id,
        goalName,
        goalUnit,
        goalExpected,
      );
      if (res.success) {
        setGoalName('');
        setIsAddGoalOpen(false);
        onUpdate();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDeleteSingleGoal = async (goalId: string, name: string) => {
    if (!confirm(`Remove "${name}" goal from ${month.name} only?`)) return;
    startTransition(async () => {
      await deleteGoal(goalId);
      onUpdate();
    });
  };

  return (
    <div className='space-y-6'>
      {/* Month Header Banner */}
      <div className='bg-[#121216] border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
        <div>
          <span className='text-xs font-semibold tracking-wider text-indigo-400 uppercase'>
            Month Tracker
          </span>
          <h2 className='text-2xl font-extrabold text-white mt-1'>
            {month.name}
          </h2>
          <p className='text-xs text-neutral-400 mt-1'>
            Customize individual goals for this specific month.
          </p>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='bg-[#1a1a22] border border-neutral-800 px-5 py-3 rounded-xl text-center'>
            <span className='text-xs text-neutral-400 block font-medium'>
              Total Achievement
            </span>
            <span className='text-2xl font-black text-emerald-400'>
              {monthTotal}%
            </span>
          </div>

          <button
            onClick={() => setIsAddGoalOpen(true)}
            className='flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer'
          >
            <Plus className='w-4 h-4' />
            <span>Add Goal</span>
          </button>

          <button
            onClick={onDelete}
            className='p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20 cursor-pointer'
            title='Delete Entire Month'
          >
            <Trash2 className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* Goals Table / List */}
      <div className='bg-[#121216] border border-neutral-800 rounded-2xl shadow-xl overflow-hidden'>
        <div className='px-6 py-4 border-b border-neutral-800 flex items-center justify-between'>
          <h3 className='font-bold text-white text-base'>Goal Categories</h3>
          <span className='text-xs text-neutral-400'>
            {month.goals.length} categories tracked in {month.name}
          </span>
        </div>

        <div className='divide-y divide-neutral-800/60'>
          {month.goals.map((goal: GoalCategory) => {
            const pct =
              goal.expected > 0
                ? Math.round((goal.achieved / goal.expected) * 100)
                : 0;

            return (
              <div
                key={goal.id}
                className='p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-[#15151c]/50 transition'
              >
                <div className='md:col-span-4 flex items-center justify-between pr-4'>
                  <div>
                    <h4 className='font-semibold text-white text-sm'>
                      {goal.name}
                    </h4>
                    <span className='text-xs text-neutral-400 capitalize'>
                      Tracked in {goal.unit}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteSingleGoal(goal.id, goal.name)}
                    className='p-1.5 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 rounded-lg transition'
                    title={`Delete "${goal.name}" from ${month.name}`}
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-[10px] uppercase font-bold text-neutral-500 mb-1'>
                    Expected
                  </label>
                  <input
                    type='number'
                    value={goal.expected}
                    onChange={(e) =>
                      handleGoalChange(
                        goal.id,
                        Number(e.target.value),
                        goal.achieved,
                      )
                    }
                    className='w-full bg-[#1c1c24] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition'
                  />
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-[10px] uppercase font-bold text-neutral-500 mb-1'>
                    Achieved
                  </label>
                  <input
                    type='number'
                    value={goal.achieved}
                    onChange={(e) =>
                      handleGoalChange(
                        goal.id,
                        goal.expected,
                        Number(e.target.value),
                      )
                    }
                    className='w-full bg-[#1c1c24] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition'
                  />
                </div>

                <div className='md:col-span-4'>
                  <div className='flex items-center justify-between text-xs mb-1'>
                    <span className='text-neutral-400 font-medium'>
                      Progress
                    </span>
                    <span
                      className={`font-bold ${
                        pct >= 100
                          ? 'text-emerald-400'
                          : pct >= 70
                            ? 'text-indigo-400'
                            : 'text-amber-400'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className='w-full bg-neutral-800 h-2 rounded-full overflow-hidden'>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct >= 100 ? 'bg-emerald-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Goal Modal */}
      {isAddGoalOpen && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4'>
          <div className='bg-[#16161c] border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl'>
            <h2 className='text-xl font-bold text-white mb-2'>
              Add Goal to {month.name}
            </h2>
            <p className='text-sm text-neutral-400 mb-6'>
              Create a target category unique to this month.
            </p>

            <form onSubmit={handleAddGoalSubmit} className='space-y-4'>
              <div>
                <label className='block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2'>
                  Goal Name
                </label>
                <input
                  type='text'
                  placeholder='e.g., Breath exercise'
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className='w-full bg-[#1e1e26] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition'
                  required
                  autoFocus
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2'>
                    Unit
                  </label>
                  <select
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    className='w-full bg-[#1e1e26] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition'
                  >
                    <option value='days'>days</option>
                    <option value='hours'>hours</option>
                    <option value='times'>times</option>
                  </select>
                </div>

                <div>
                  <label className='block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2'>
                    Expected Target
                  </label>
                  <input
                    type='number'
                    value={goalExpected}
                    onChange={(e) => setGoalExpected(Number(e.target.value))}
                    className='w-full bg-[#1e1e26] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition'
                    required
                  />
                </div>
              </div>

              <div className='flex justify-end space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setIsAddGoalOpen(false)}
                  className='px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isPending}
                  className='px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer'
                >
                  {isPending ? 'Adding...' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateMonthTotal(goals: { expected: number; achieved: number }[]) {
  if (!goals || goals.length === 0) return 0;
  let totalPercentage = 0;
  goals.forEach((goal) => {
    if (goal.expected > 0) {
      const pct = (goal.achieved / goal.expected) * 100;
      totalPercentage += Math.min(pct, 100);
    }
  });
  return Math.round(totalPercentage / goals.length);
}
