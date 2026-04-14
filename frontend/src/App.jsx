import { useState } from 'react';
import './index.css';

import PointsHero    from './components/PointsHero';
import WeeklyTable   from './components/WeeklyTable';
import BottomNav     from './components/BottomNav';
import QuickActions  from './components/QuickActions';
import TaskCard      from './components/TaskCard';
import RewardCard    from './components/RewardCard';
import StreakBar      from './components/StreakBar';

/* ── Demo data ─────────────────────────────────────────────── */
const DEMO_TASKS = [
  { id: 1, name: 'Убраться в комнате',   category: 'home',   points: 5,  status: 'pending',   type: 'daily' },
  { id: 2, name: 'Сделать домашнее задание', category: 'study', points: 8,  status: 'done',  type: 'daily' },
  { id: 3, name: 'Зарядка 20 минут',     category: 'active', points: 6,  status: 'confirmed', type: 'daily' },
  { id: 4, name: 'Порисовать',            category: 'hobby',  points: 4,  status: 'pending',   type: 'once' },
  { id: 5, name: 'Причесаться',           category: 'looks',  points: 3,  status: 'pending',   type: 'required' },
];

const DEMO_REWARDS = [
  { id: 1, name: 'Карманные деньги',  icon: '💰', price: 100, type: 'money' },
  { id: 2, name: 'Кино с другом',     icon: '🎬', price: 150, type: 'gift' },
  { id: 3, name: '+1 час гаджетов',   icon: '📱', price: 50,  type: 'permission' },
  { id: 4, name: 'Пицца',             icon: '🍕', price: 80,  type: 'gift' },
];

const DEMO_WEEK_DATA = {
  Mon: { home: 5,  study: 8,  active: 6, hobby: 0, like: 2, looks: 3 },
  Tue: { home: 0,  study: 5,  active: 0, hobby: 4, like: 0, looks: 0 },
  Wed: { home: 5,  study: 8,  active: 6, hobby: 0, like: 2, looks: 3 },
  Thu: { home: 0,  study: 0,  active: 0, hobby: 0, like: 0, looks: 0 },
  Fri: { home: 0,  study: 0,  active: 0, hobby: 0, like: 0, looks: 0 },
  Sat: { home: 0,  study: 0,  active: 0, hobby: 0, like: 0, looks: 0 },
  Sun: { home: 0,  study: 0,  active: 0, hobby: 0, like: 0, looks: 0 },
};

/* ── App ────────────────────────────────────────────────────── */
export default function App() {
  const [activeNav, setActiveNav] = useState('home');
  const [tasks, setTasks]         = useState(DEMO_TASKS);
  const [points, setPoints]       = useState(142);
  const [x2Used, setX2Used]       = useState(1);
  const [isParent, setIsParent]   = useState(false);

  const handleComplete = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'done' } : t))
    );
  };

  const handleConfirm = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setPoints((p) => p + task.points);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'confirmed' } : t))
      );
    }
  };

  return (
    <div className="app-container">
      {/* Role toggle — only for demo */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '12px 16px 0',
        gap: 8,
      }}>
        <button
          className={isParent ? 'btn-ghost btn-sm' : 'btn-primary btn-sm'}
          style={{ width: 'auto' }}
          onClick={() => setIsParent(false)}
        >
          👦 Ребёнок
        </button>
        <button
          className={isParent ? 'btn-secondary btn-sm' : 'btn-ghost btn-sm'}
          style={{ width: 'auto' }}
          onClick={() => setIsParent(true)}
        >
          👩 Взрослый
        </button>
      </div>

      <div className="page">

        {/* ── HOME tab ── */}
        {activeNav === 'home' && !isParent && (
          <>
            <PointsHero points={points} rate={1} name="Саша" />

            <StreakBar
              completedDays={['Mon', 'Tue', 'Wed']}
              today="Thu"
            />

            <div className="section-title">Задания сегодня</div>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                isParent={false}
              />
            ))}

            <div className="section-title">Таблица недели</div>
            <WeeklyTable data={DEMO_WEEK_DATA} today="Thu" />
          </>
        )}

        {/* ── HOME tab (parent) ── */}
        {activeNav === 'home' && isParent && (
          <>
            <h2 style={{ marginBottom: 16 }}>Привет, мама 👋</h2>

            <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36 }}>👦</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Саша</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  ⭐ {points} баллов · ≈ {points} ₽
                </div>
              </div>
            </div>

            <div className="section-title">Быстрые действия</div>
            <QuickActions
              x2Used={x2Used}
              onLike={() => {
                setPoints((p) => p + 2);
                alert('👍 Лайк поставлен! +2 ⭐');
              }}
              onPoints={() => {
                setPoints((p) => p + 5);
                alert('➕ Начислено +5 ⭐');
              }}
              onConfirm={() => {
                const pending = tasks.find((t) => t.status === 'done');
                if (pending) handleConfirm(pending.id);
                else alert('Нет заданий для подтверждения');
              }}
              onDouble={() => {
                setX2Used((n) => n + 1);
                alert('⚡ Режим X2 включён на сегодня!');
              }}
            />

            <div className="section-title">Задания детей</div>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onConfirm={handleConfirm}
                isParent={true}
              />
            ))}
          </>
        )}

        {/* ── TASKS tab ── */}
        {activeNav === 'tasks' && (
          <>
            <h2 style={{ marginBottom: 16 }}>Все задания</h2>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onConfirm={handleConfirm}
                isParent={isParent}
              />
            ))}
          </>
        )}

        {/* ── SHOP tab ── */}
        {activeNav === 'shop' && (
          <>
            <PointsHero points={points} rate={1} />

            <div className="section-title">Магазин наград</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {DEMO_REWARDS.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  balance={points}
                  onBuy={(id) => {
                    const r = DEMO_REWARDS.find((rw) => rw.id === id);
                    if (r) {
                      setPoints((p) => p - r.price);
                      alert(`🎉 Куплено: ${r.name}! Взрослый получит уведомление.`);
                    }
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* ── HISTORY tab ── */}
        {activeNav === 'history' && (
          <>
            <h2 style={{ marginBottom: 16 }}>История</h2>
            {[
              { who: 'Мама', what: 'Уборка', pts: +5,  time: '18:32', emoji: '🏠' },
              { who: 'Папа', what: '👍 Лайк', pts: +2, time: '17:10', emoji: '👍' },
              { who: 'Мама', what: 'Зарядка', pts: +6, time: '09:00', emoji: '⚡' },
              { who: 'Система', what: 'Покупка в магазине', pts: -50, time: 'вчера', emoji: '🛒' },
            ].map((item, i) => (
              <div key={i} className="task-card" style={{ marginBottom: 8 }}>
                <div
                  className="task-icon"
                  style={{ background: 'var(--bg-secondary)' }}
                  aria-hidden="true"
                >
                  {item.emoji}
                </div>
                <div className="task-info">
                  <div className="task-name">{item.who} — {item.what}</div>
                  <div className="task-meta">{item.time}</div>
                </div>
                <span
                  className="task-points"
                  style={{ color: item.pts > 0 ? 'var(--primary)' : 'var(--danger)' }}
                >
                  {item.pts > 0 ? '+' : ''}{item.pts} ⭐
                </span>
              </div>
            ))}
          </>
        )}

      </div>

      <BottomNav active={activeNav} onChange={setActiveNav} />
    </div>
  );
}
