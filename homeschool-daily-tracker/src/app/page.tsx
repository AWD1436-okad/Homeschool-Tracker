"use client";

import { useEffect, useMemo, useState } from "react";
import {
  countDoneTasks,
  createDefaultData,
  createTask,
  emptyTaskDraft,
  ensureDayExists,
  formatDisplayDate,
  getBookName,
  getBooksForSubject,
  getSubjectName,
  getTodayDateKey,
  isArabicSubject,
  isPastDay,
  shiftDate,
  sortTasks,
  STORAGE_KEY,
  type Task,
  type TaskDraft,
  type TaskStatus,
  type TrackerData,
  type ViewName,
} from "@/lib/tracker";

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string; tone: string }> = [
  { value: "not_done", label: "Not done", tone: "var(--warning)" },
  { value: "in_progress", label: "In progress", tone: "var(--brand)" },
  { value: "done", label: "Done", tone: "var(--success)" },
];

const VIEW_LABELS: Array<{ id: ViewName; label: string }> = [
  { id: "today", label: "Today" },
  { id: "history", label: "History" },
  { id: "calendar", label: "Calendar" },
  { id: "settings", label: "Settings" },
];

function loadData(todayDateKey: string) {
  if (typeof window === "undefined") return createDefaultData(todayDateKey);
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return createDefaultData(todayDateKey);
  try {
    return ensureDayExists(JSON.parse(saved) as TrackerData, todayDateKey);
  } catch {
    return createDefaultData(todayDateKey);
  }
}

function emptyNotice(title: string, text: string) {
  return (
    <div className="panel p-6 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{text}</p>
    </div>
  );
}

export default function Home() {
  const todayDateKey = getTodayDateKey();
  const [data, setData] = useState<TrackerData>(() => loadData(todayDateKey));
  const [activeView, setActiveView] = useState<ViewName>("today");
  const [selectedDate, setSelectedDate] = useState(todayDateKey);
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [bookName, setBookName] = useState("");
  const [bookSubjectId, setBookSubjectId] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const syncOnlineState = () => setIsOnline(window.navigator.onLine);
    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  const todayTasks = useMemo(
    () => sortTasks(data.tasks.filter((task) => task.date === todayDateKey)),
    [data.tasks, todayDateKey],
  );

  const calendarTasks = useMemo(
    () => sortTasks(data.tasks.filter((task) => task.date === selectedDate)),
    [data.tasks, selectedDate],
  );

  const days = useMemo(
    () =>
      [...data.days]
        .sort((left, right) => right.date.localeCompare(left.date))
        .map((day) => {
          const dayTasks = data.tasks.filter((task) => task.date === day.date);
          return {
            date: day.date,
            taskCount: dayTasks.length,
            doneCount: countDoneTasks(dayTasks),
          };
        }),
    [data.days, data.tasks],
  );

  const availableBooks = getBooksForSubject(data, draft.subjectId);
  const selectedSubjectName = data.subjects.find((subject) => subject.id === draft.subjectId)?.name;
  const needsArabicExercise = isArabicSubject(selectedSubjectName);

  const resetForm = () => {
    setDraft(emptyTaskDraft());
    setEditingTaskId(null);
    setShowTaskForm(false);
  };

  const beginTask = () => {
    setDraft(emptyTaskDraft());
    setEditingTaskId(null);
    setShowTaskForm(true);
  };

  const saveTask = () => {
    if (!draft.subjectId || !draft.bookId || !draft.page.trim()) {
      window.alert("Please choose a subject, choose a book, and enter a page.");
      return;
    }
    if (needsArabicExercise && !draft.arabicExercise.trim()) {
      window.alert("Arabic tasks need an exercise value too.");
      return;
    }
    setData((current) => {
      const safeData = ensureDayExists(current, todayDateKey);
      if (!editingTaskId) {
        return { ...safeData, tasks: [...safeData.tasks, createTask(todayDateKey, draft)] };
      }
      return {
        ...safeData,
        tasks: safeData.tasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                subjectId: draft.subjectId,
                bookId: draft.bookId,
                page: draft.page.trim(),
                arabicExercise: draft.arabicExercise.trim(),
                status: draft.status,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      };
    });
    resetForm();
  };

  const editTask = (task: Task) => {
    setDraft({
      subjectId: task.subjectId,
      bookId: task.bookId,
      page: task.page,
      arabicExercise: task.arabicExercise,
      status: task.status,
    });
    setEditingTaskId(task.id);
    setShowTaskForm(true);
  };

  const deleteTask = (task: Task) => {
    if (task.date !== todayDateKey) return;
    setData((current) => ({
      ...current,
      tasks: current.tasks.filter((item) => item.id !== task.id),
    }));
  };

  const changeTaskStatus = (taskId: string, status: TaskStatus) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, status, updatedAt: new Date().toISOString() } : task,
      ),
    }));
  };

  const addSubject = () => {
    if (!subjectName.trim()) return;
    setData((current) => ({
      ...current,
      subjects: [
        ...current.subjects,
        { id: `subject-${Date.now()}`, name: subjectName.trim() },
      ].sort((left, right) => left.name.localeCompare(right.name)),
    }));
    setSubjectName("");
  };

  const addBook = () => {
    if (!bookSubjectId || !bookName.trim()) return;
    setData((current) => ({
      ...current,
      books: [
        ...current.books,
        { id: `book-${Date.now()}`, subjectId: bookSubjectId, name: bookName.trim() },
      ].sort((left, right) => left.name.localeCompare(right.name)),
    }));
    setBookName("");
  };

  const renameSubject = (subjectId: string) => {
    const subject = data.subjects.find((item) => item.id === subjectId);
    const nextName = window.prompt("Edit subject name", subject?.name ?? "");
    if (!nextName?.trim()) return;
    setData((current) => ({
      ...current,
      subjects: current.subjects.map((item) =>
        item.id === subjectId ? { ...item, name: nextName.trim() } : item,
      ),
    }));
  };

  const renameBook = (bookId: string) => {
    const book = data.books.find((item) => item.id === bookId);
    const nextName = window.prompt("Edit book name", book?.name ?? "");
    if (!nextName?.trim()) return;
    setData((current) => ({
      ...current,
      books: current.books.map((item) =>
        item.id === bookId ? { ...item, name: nextName.trim() } : item,
      ),
    }));
  };

  const renderTaskCard = (task: Task, canDelete: boolean) => (
    <article key={task.id} className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
            {getSubjectName(data, task.subjectId)}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{getBookName(data, task.bookId)}</h3>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Page {task.page}
            {task.arabicExercise ? ` • Exercise ${task.arabicExercise}` : ""}
          </p>
          {task.carriedFromTaskId ? (
            <p className="mt-2 text-xs font-medium text-[var(--brand)]">Carried over</p>
          ) : null}
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{
            background:
              STATUS_OPTIONS.find((status) => status.value === task.status)?.tone ?? "var(--brand)",
          }}
        >
          {STATUS_OPTIONS.find((status) => status.value === task.status)?.label}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            className="pill-button border bg-white text-sm"
            onClick={() => changeTaskStatus(task.id, status.value)}
            style={{ borderColor: status.value === task.status ? status.tone : "var(--border-soft)" }}
            type="button"
          >
            {status.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          className="pill-button flex-1 border border-[var(--border-soft)] bg-white text-sm"
          onClick={() => editTask(task)}
          type="button"
        >
          Edit
        </button>
        <button
          className="pill-button flex-1 text-sm text-white"
          disabled={!canDelete}
          onClick={() => deleteTask(task)}
          style={{ background: canDelete ? "var(--danger)" : "var(--surface-soft)", opacity: canDelete ? 1 : 0.65 }}
          type="button"
        >
          {canDelete ? "Delete" : "Past tasks stay kept"}
        </button>
      </div>
    </article>
  );

  return (
    <main className="app-shell">
      <section className="panel overflow-hidden">
        <div className="bg-[var(--surface-strong)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                Homeschool Daily Tracker
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight">
                A calm daily plan that rolls forward with you.
              </h1>
            </div>
            <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--ink-soft)]">
              Milestone 1 build
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            This first implementation proves the planner workflow and carry-over rules using local
            browser storage. Secure account screens and cloud sync come next.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm text-[var(--ink-soft)]">Today</p>
            <p className="mt-2 text-lg font-semibold">{formatDisplayDate(todayDateKey)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm text-[var(--ink-soft)]">Connection</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="status-dot" style={{ background: isOnline ? "var(--success)" : "var(--warning)" }} />
              <span className="font-semibold">{isOnline ? "Online" : "Offline-ready mode"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 flex gap-3">
        <button className="pill-button flex-1 bg-[var(--brand)] text-white" onClick={beginTask} type="button">
          New Task
        </button>
        <button
          className="pill-button flex-1 border border-[var(--border-soft)] bg-[var(--surface)]"
          onClick={() => {
            setSelectedDate(todayDateKey);
            setActiveView("today");
          }}
          type="button"
        >
          Jump to Today
        </button>
      </section>

      {showTaskForm ? (
        <section className="panel mt-4 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Task form</p>
              <h2 className="text-xl font-semibold">{editingTaskId ? "Edit task" : "Add a new task"}</h2>
            </div>
            <button
              className="pill-button border border-[var(--border-soft)] bg-white text-sm text-[var(--ink-soft)]"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">Subject</span>
              <select
                className="px-4 py-3"
                value={draft.subjectId}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    subjectId: event.target.value,
                    bookId: "",
                    arabicExercise: "",
                  })
                }
              >
                <option value="">Select a subject</option>
                {data.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">Book</span>
              <select
                className="px-4 py-3"
                disabled={!draft.subjectId}
                value={draft.bookId}
                onChange={(event) => setDraft({ ...draft, bookId: event.target.value })}
              >
                <option value="">{draft.subjectId ? "Select a book" : "Choose subject first"}</option>
                {availableBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">Page</span>
              <input className="px-4 py-3" placeholder="Example: 24" value={draft.page} onChange={(event) => setDraft({ ...draft, page: event.target.value })} />
            </label>
            {needsArabicExercise ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">Arabic exercise</span>
                <input
                  className="px-4 py-3"
                  placeholder="Example: Exercise 3"
                  value={draft.arabicExercise}
                  onChange={(event) => setDraft({ ...draft, arabicExercise: event.target.value })}
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">Status</span>
              <select
                className="px-4 py-3"
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus })}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="pill-button mt-4 w-full bg-[var(--brand)] text-white" onClick={saveTask} type="button">
            {editingTaskId ? "Save changes" : "Save task"}
          </button>
        </section>
      ) : null}

      {activeView === "today" ? (
        <section className="mt-4 space-y-3">
          <div className="panel p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Today</p>
                <h2 className="text-2xl font-semibold">{formatDisplayDate(todayDateKey)}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--ink-soft)]">Completed</p>
                <p className="text-2xl font-semibold">{countDoneTasks(todayTasks)}/{todayTasks.length}</p>
              </div>
            </div>
          </div>
          {todayTasks.length === 0
            ? emptyNotice("No tasks for today yet", "Start by tapping New Task. Future unfinished tasks will carry into the next day automatically.")
            : todayTasks.map((task) => renderTaskCard(task, true))}
        </section>
      ) : null}

      {activeView === "history" ? (
        <section className="mt-4 space-y-3">
          <div className="panel p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">History</p>
            <h2 className="text-2xl font-semibold">Past daily lists</h2>
          </div>
          {days.map((day) => (
            <button
              key={day.date}
              className="panel block w-full p-4 text-left"
              onClick={() => {
                setData((current) => ensureDayExists(current, day.date));
                setSelectedDate(day.date);
                setActiveView("calendar");
              }}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{formatDisplayDate(day.date)}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{day.doneCount} done out of {day.taskCount} tasks</p>
                </div>
                <div className="rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--ink-soft)]">
                  Open day
                </div>
              </div>
            </button>
          ))}
        </section>
      ) : null}

      {activeView === "calendar" ? (
        <section className="mt-4 space-y-3">
          <div className="panel p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Calendar</p>
            <h2 className="text-2xl font-semibold">{formatDisplayDate(selectedDate)}</h2>
            <div className="mt-4 flex gap-2">
              <button
                className="pill-button flex-1 border border-[var(--border-soft)] bg-white"
                onClick={() => {
                  const previous = shiftDate(selectedDate, -1);
                  setData((current) => ensureDayExists(current, previous));
                  setSelectedDate(previous);
                }}
                type="button"
              >
                Previous day
              </button>
              <button
                className="pill-button flex-1 border border-[var(--border-soft)] bg-white"
                onClick={() => {
                  const next = shiftDate(selectedDate, 1);
                  setData((current) => ensureDayExists(current, next));
                  setSelectedDate(next);
                }}
                type="button"
              >
                Next day
              </button>
            </div>
            <label className="mt-3 block">
              <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">Pick a date</span>
              <input
                className="px-4 py-3"
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setData((current) => ensureDayExists(current, event.target.value));
                  setSelectedDate(event.target.value);
                }}
              />
            </label>
          </div>
          {calendarTasks.length === 0
            ? emptyNotice("No tasks saved on this date", "As you use the tracker, each day will stay visible here for easy browsing.")
            : calendarTasks.map((task) => renderTaskCard(task, !isPastDay(selectedDate, todayDateKey)))}
        </section>
      ) : null}

      {activeView === "settings" ? (
        <section className="mt-4 space-y-3">
          <div className="panel p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Settings</p>
            <h2 className="text-2xl font-semibold">Subjects and books</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Keep this list simple. The task form will reuse whatever you add here later.
            </p>
          </div>
          <section className="panel p-4">
            <h3 className="text-lg font-semibold">Add subject</h3>
            <div className="mt-3 flex gap-2">
              <input className="px-4 py-3" placeholder="Example: Science" value={subjectName} onChange={(event) => setSubjectName(event.target.value)} />
              <button className="pill-button bg-[var(--brand)] px-5 text-white" onClick={addSubject} type="button">
                Add
              </button>
            </div>
          </section>
          <section className="panel p-4">
            <h3 className="text-lg font-semibold">Add book</h3>
            <div className="mt-3 space-y-3">
              <select className="px-4 py-3" value={bookSubjectId} onChange={(event) => setBookSubjectId(event.target.value)}>
                <option value="">Choose subject</option>
                {data.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input className="px-4 py-3" placeholder="Example: Geometry Book 1" value={bookName} onChange={(event) => setBookName(event.target.value)} />
                <button className="pill-button bg-[var(--brand)] px-5 text-white" onClick={addBook} type="button">
                  Add
                </button>
              </div>
            </div>
          </section>
          <section className="panel p-4">
            <h3 className="text-lg font-semibold">Current subjects</h3>
            <div className="mt-3 space-y-3">
              {data.subjects.map((subject) => (
                <div key={subject.id} className="rounded-2xl border border-[var(--border-soft)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{subject.name}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {data.books.filter((book) => book.subjectId === subject.id).length} books
                      </p>
                    </div>
                    <button
                      className="pill-button border border-[var(--border-soft)] bg-[var(--surface)] text-sm"
                      onClick={() => renameSubject(subject.id)}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.books.filter((book) => book.subjectId === subject.id).map((book) => (
                      <button
                        key={book.id}
                        className="rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm"
                        onClick={() => renameBook(book.id)}
                        type="button"
                      >
                        {book.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      <nav className="bottom-nav" aria-label="Primary">
        <div className="bottom-nav-inner">
          {VIEW_LABELS.map((view) => (
            <button
              key={view.id}
              className="pill-button text-sm"
              onClick={() => setActiveView(view.id)}
              style={{
                background: activeView === view.id ? "var(--brand)" : "var(--surface)",
                color: activeView === view.id ? "white" : "var(--ink-strong)",
                border: activeView === view.id ? "none" : "1px solid var(--border-soft)",
              }}
              type="button"
            >
              {view.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
