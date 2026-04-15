"use client";

import { useEffect, useMemo, useState } from "react";
import {
  countDoneTasks,
  createDefaultData,
  createTask,
  emptyTaskDraft,
  ensureDayExists,
  formatDisplayDate,
  getBook,
  getBookName,
  getBooksForSubject,
  getSubjectName,
  getTodayDateKey,
  isPastDay,
  normalizeTrackerData,
  shiftDate,
  sortTasks,
  STORAGE_KEY,
  type Book,
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
  { id: "settings", label: "Settings" },
];

function loadData(todayDateKey: string) {
  if (typeof window === "undefined") {
    return createDefaultData(todayDateKey);
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return createDefaultData(todayDateKey);
  }

  try {
    const parsed = JSON.parse(saved) as TrackerData;
    return ensureDayExists(normalizeTrackerData(parsed, todayDateKey), todayDateKey);
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

function getProgressNote(page: string, book: Book | undefined) {
  if (!book?.pageCount) {
    return null;
  }

  const currentPage = Number.parseInt(page, 10);
  if (!Number.isFinite(currentPage) || currentPage <= 0) {
    return `This book has ${book.pageCount} pages.`;
  }

  return `Page ${currentPage} of ${book.pageCount}`;
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
  const [bookPageCount, setBookPageCount] = useState("");
  const [bookSubjectId, setBookSubjectId] = useState("");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingBookName, setEditingBookName] = useState("");
  const [editingBookPageCount, setEditingBookPageCount] = useState("");
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

  const selectedDayTasks = useMemo(
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
  const selectedBook = getBook(data, draft.bookId);
  const progressNote = getProgressNote(draft.page, selectedBook);

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
      window.alert("Choose a subject, choose a book, enter a page, then save.");
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
    });
    setEditingTaskId(task.id);
    setShowTaskForm(true);
    setActiveView(task.date === todayDateKey ? "today" : "history");
    setSelectedDate(task.date);
  };

  const deleteTask = (task: Task) => {
    if (task.date !== todayDateKey) {
      return;
    }

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
    if (!subjectName.trim()) {
      return;
    }

    setData((current) => ({
      ...current,
      subjects: [...current.subjects, { id: `subject-${Date.now()}`, name: subjectName.trim() }].sort(
        (left, right) => left.name.localeCompare(right.name),
      ),
    }));
    setSubjectName("");
  };

  const addBook = () => {
    if (!bookSubjectId || !bookName.trim()) {
      return;
    }

    const parsedPageCount = Number.parseInt(bookPageCount, 10);
    if (!Number.isFinite(parsedPageCount) || parsedPageCount <= 0) {
      window.alert("Enter the total number of pages for this book.");
      return;
    }

    setData((current) => ({
      ...current,
      books: [
        ...current.books,
        {
          id: `book-${Date.now()}`,
          subjectId: bookSubjectId,
          name: bookName.trim(),
          pageCount: parsedPageCount,
        },
      ].sort((left, right) => left.name.localeCompare(right.name)),
    }));
    setBookName("");
    setBookPageCount("");
  };

  const renameSubject = (subjectId: string) => {
    const subject = data.subjects.find((item) => item.id === subjectId);
    const nextName = window.prompt("Edit subject name", subject?.name ?? "");
    if (!nextName?.trim()) {
      return;
    }

    setData((current) => ({
      ...current,
      subjects: current.subjects.map((item) =>
        item.id === subjectId ? { ...item, name: nextName.trim() } : item,
      ),
    }));
  };

  const beginBookEdit = (bookId: string) => {
    const book = data.books.find((item) => item.id === bookId);
    if (!book) {
      return;
    }

    setEditingBookId(book.id);
    setEditingBookName(book.name);
    setEditingBookPageCount(book.pageCount ? String(book.pageCount) : "");
  };

  const cancelBookEdit = () => {
    setEditingBookId(null);
    setEditingBookName("");
    setEditingBookPageCount("");
  };

  const saveBookEdit = (bookId: string) => {
    const parsedPageCount = Number.parseInt(editingBookPageCount, 10);
    if (!Number.isFinite(parsedPageCount) || parsedPageCount <= 0) {
      window.alert("Page count must be a whole number greater than 0.");
      return;
    }
    if (!editingBookName.trim()) {
      window.alert("Enter a book name before saving.");
      return;
    }

    setData((current) => ({
      ...current,
      books: current.books.map((item) =>
        item.id === bookId
          ? { ...item, name: editingBookName.trim(), pageCount: parsedPageCount }
          : item,
      ),
    }));
    cancelBookEdit();
  };

  const deleteBook = (bookId: string) => {
    const book = data.books.find((item) => item.id === bookId);
    if (!book) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${book.name}" from Settings? Existing saved tasks will stay in history.`,
    );
    if (!confirmed) {
      return;
    }

    setData((current) => ({
      ...current,
      books: current.books.filter((item) => item.id !== bookId),
    }));

    if (draft.bookId === bookId) {
      setDraft((current) => ({ ...current, bookId: "" }));
    }
  };

  const deleteAccount = () => {
    const confirmed = window.confirm(
      "Delete this account and all saved homeschool data on this device? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    const freshData = createDefaultData(todayDateKey);
    setData(freshData);
    setActiveView("today");
    setSelectedDate(todayDateKey);
    setShowTaskForm(false);
    setEditingTaskId(null);
    setDraft(emptyTaskDraft());
    setSubjectName("");
    setBookName("");
    setBookPageCount("");
    setBookSubjectId("");
    cancelBookEdit();
    window.alert("Your local account data has been deleted from this device.");
  };

  const renderTaskCard = (task: Task, canDelete: boolean) => {
    const book = getBook(data, task.bookId);
    const pageLabel = book?.pageCount ? `Page ${task.page} of ${book.pageCount}` : `Page ${task.page}`;

    return (
      <article key={task.id} className="panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-kicker">{getSubjectName(data, task.subjectId)}</p>
            <h3 className="mt-1 text-lg font-semibold">{getBookName(data, task.bookId)}</h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{pageLabel}</p>
            {task.carriedFromTaskId ? (
              <p className="mt-2 text-xs font-medium text-[var(--brand)]">Carried over from the previous day</p>
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
            Edit task
          </button>
          <button
            className="pill-button flex-1 text-sm text-white"
            disabled={!canDelete}
            onClick={() => deleteTask(task)}
            style={{
              background: canDelete ? "var(--danger)" : "var(--surface-soft)",
              opacity: canDelete ? 1 : 0.65,
            }}
            type="button"
          >
            {canDelete ? "Delete task" : "Past tasks stay saved"}
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="section-kicker">Homeschool Tracker</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight">Know what to do next.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            Today is for adding and finishing work. History is for looking back. Settings is where
            you manage your subjects and books.
          </p>
        </div>
        <div className="hero-grid">
          <div className="hero-stat">
            <p className="text-sm text-[var(--ink-soft)]">Today</p>
            <p className="mt-2 text-lg font-semibold">{formatDisplayDate(todayDateKey)}</p>
          </div>
          <div className="hero-stat">
            <p className="text-sm text-[var(--ink-soft)]">Connection</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="status-dot" style={{ background: isOnline ? "var(--success)" : "var(--warning)" }} />
              <span className="font-semibold">{isOnline ? "Online" : "Offline-ready"}</span>
            </div>
          </div>
        </div>
      </section>

      <nav className="top-tabs" aria-label="Sections">
        {VIEW_LABELS.map((view) => (
          <button
            key={view.id}
            className="pill-button text-sm"
            onClick={() => setActiveView(view.id)}
            style={{
              background: activeView === view.id ? "var(--brand)" : "white",
              color: activeView === view.id ? "white" : "var(--ink-strong)",
              borderColor: activeView === view.id ? "var(--brand)" : "var(--border-soft)",
            }}
            type="button"
          >
            {view.label}
          </button>
        ))}
      </nav>

      {showTaskForm ? (
        <section className="panel mt-4 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">{editingTaskId ? "Edit task" : "Add a task"}</p>
              <h2 className="text-xl font-semibold">
                {editingTaskId ? "Update this task" : "Follow these 3 steps"}
              </h2>
            </div>
            <button
              className="pill-button border border-[var(--border-soft)] bg-white text-sm text-[var(--ink-soft)]"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          </div>
          <ol className="space-y-3">
            <li className="step-card">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">1. Choose subject</span>
                <select
                  className="px-4 py-3"
                  value={draft.subjectId}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      subjectId: event.target.value,
                      bookId: "",
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
            </li>
            <li className="step-card">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">2. Choose book</span>
                <select
                  className="px-4 py-3"
                  disabled={!draft.subjectId}
                  value={draft.bookId}
                  onChange={(event) => setDraft({ ...draft, bookId: event.target.value })}
                >
                  <option value="">{draft.subjectId ? "Select a book" : "Choose a subject first"}</option>
                  {availableBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
                </select>
              </label>
            </li>
            <li className="step-card">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">3. Enter page</span>
                <input
                  className="px-4 py-3"
                  inputMode="numeric"
                  placeholder="Example: 24"
                  value={draft.page}
                  onChange={(event) => setDraft({ ...draft, page: event.target.value })}
                />
                {progressNote ? <p className="mt-2 text-sm text-[var(--ink-soft)]">{progressNote}</p> : null}
              </label>
            </li>
          </ol>
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
                <p className="section-kicker">Today</p>
                <h2 className="text-2xl font-semibold">{formatDisplayDate(todayDateKey)}</h2>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Add today&apos;s work here, then update each task as you go.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--ink-soft)]">Done</p>
                <p className="text-2xl font-semibold">
                  {countDoneTasks(todayTasks)}/{todayTasks.length}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="pill-button flex-1 bg-[var(--brand)] text-white" onClick={beginTask} type="button">
                Add task
              </button>
              <button
                className="pill-button flex-1 border border-[var(--border-soft)] bg-white"
                onClick={() => {
                  setSelectedDate(todayDateKey);
                  setActiveView("history");
                }}
                type="button"
              >
                Open history
              </button>
            </div>
          </div>
          {todayTasks.length === 0
            ? emptyNotice(
                "No tasks for today yet",
                "Tap Add task, choose the subject, choose the book, enter the page, and save.",
              )
            : todayTasks.map((task) => renderTaskCard(task, true))}
        </section>
      ) : null}

      {activeView === "history" ? (
        <section className="mt-4 space-y-3">
          <div className="panel p-4">
            <p className="section-kicker">History</p>
            <h2 className="text-2xl font-semibold">Past days stay here</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Choose a saved day to review work. Today stays separate on the Today tab.
            </p>
          </div>
          <section className="panel p-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">Choose a date to view</span>
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
            <div className="mt-3 flex gap-2">
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
          </section>
          <section className="panel p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="section-kicker">Selected day</p>
                <h3 className="text-xl font-semibold">{formatDisplayDate(selectedDate)}</h3>
              </div>
              <div className="text-right text-sm text-[var(--ink-soft)]">
                {countDoneTasks(selectedDayTasks)} done of {selectedDayTasks.length}
              </div>
            </div>
          </section>
          <section className="history-day-list">
            {days.map((day) => (
              <button
                key={day.date}
                className="history-day-button"
                onClick={() => setSelectedDate(day.date)}
                type="button"
              >
                <span>
                  <strong>{formatDisplayDate(day.date)}</strong>
                  <small>
                    {day.doneCount} done of {day.taskCount}
                  </small>
                </span>
                <span className="text-sm font-semibold text-[var(--brand)]">
                  {day.date === selectedDate ? "Viewing" : "Open"}
                </span>
              </button>
            ))}
          </section>
          {selectedDayTasks.length === 0
            ? emptyNotice(
                "No tasks saved on this day",
                "Pick another day from the list above, or return to Today to add work.",
              )
            : selectedDayTasks.map((task) => renderTaskCard(task, !isPastDay(selectedDate, todayDateKey)))}
        </section>
      ) : null}

      {activeView === "settings" ? (
        <section className="mt-4 space-y-3">
          <div className="panel p-4">
            <p className="section-kicker">Settings</p>
            <h2 className="text-2xl font-semibold">Manage subjects and books</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              First add subjects. Then add books under each subject with the total number of pages.
            </p>
          </div>
          <section className="panel p-4">
            <h3 className="text-lg font-semibold">Add a subject</h3>
            <div className="mt-3 flex gap-2">
              <input
                className="px-4 py-3"
                placeholder="Example: Science"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
              />
              <button className="pill-button bg-[var(--brand)] px-5 text-white" onClick={addSubject} type="button">
                Add
              </button>
            </div>
          </section>
          <section className="panel p-4">
            <h3 className="text-lg font-semibold">Add a book</h3>
            <div className="mt-3 space-y-3">
              <select className="px-4 py-3" value={bookSubjectId} onChange={(event) => setBookSubjectId(event.target.value)}>
                <option value="">Choose the subject first</option>
                {data.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <input
                className="px-4 py-3"
                placeholder="Book name"
                value={bookName}
                onChange={(event) => setBookName(event.target.value)}
              />
              <input
                className="px-4 py-3"
                inputMode="numeric"
                placeholder="Total pages"
                value={bookPageCount}
                onChange={(event) => setBookPageCount(event.target.value)}
              />
              <button className="pill-button w-full bg-[var(--brand)] text-white" onClick={addBook} type="button">
                Save book
              </button>
            </div>
          </section>
          <section className="panel p-4">
            <h3 className="text-lg font-semibold">Current subjects and books</h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Edit names, update page counts, or delete books you no longer need.
            </p>
            <div className="mt-3 space-y-3">
              {data.subjects.map((subject) => (
                <div key={subject.id} className="settings-group">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{subject.name}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {data.books.filter((book) => book.subjectId === subject.id).length} books
                      </p>
                    </div>
                    <button
                      className="pill-button border border-[var(--border-soft)] bg-white text-sm"
                      onClick={() => renameSubject(subject.id)}
                      type="button"
                    >
                      Edit subject
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.books.filter((book) => book.subjectId === subject.id).length === 0 ? (
                      <p className="text-sm text-[var(--ink-soft)]">No books added yet.</p>
                    ) : (
                      data.books
                        .filter((book) => book.subjectId === subject.id)
                        .map((book) => (
                          <div key={book.id} className="book-row">
                            {editingBookId === book.id ? (
                              <div className="book-edit-form">
                                <label className="block">
                                  <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
                                    Book name
                                  </span>
                                  <input
                                    className="px-4 py-3"
                                    value={editingBookName}
                                    onChange={(event) => setEditingBookName(event.target.value)}
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
                                    Total pages
                                  </span>
                                  <input
                                    className="px-4 py-3"
                                    inputMode="numeric"
                                    value={editingBookPageCount}
                                    onChange={(event) => setEditingBookPageCount(event.target.value)}
                                  />
                                </label>
                                <div className="book-actions">
                                  <button
                                    className="pill-button bg-[var(--brand)] text-sm text-white"
                                    onClick={() => saveBookEdit(book.id)}
                                    type="button"
                                  >
                                    Save book
                                  </button>
                                  <button
                                    className="pill-button border border-[var(--border-soft)] bg-white text-sm"
                                    onClick={cancelBookEdit}
                                    type="button"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <p className="font-medium">{book.name}</p>
                                  <p className="text-sm text-[var(--ink-soft)]">
                                    {book.pageCount ? `${book.pageCount} pages` : "Page count not set"}
                                  </p>
                                </div>
                                <div className="book-actions">
                                  <button
                                    className="pill-button border border-[var(--border-soft)] bg-white text-sm"
                                    onClick={() => beginBookEdit(book.id)}
                                    type="button"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="pill-button text-sm text-white"
                                    onClick={() => deleteBook(book.id)}
                                    style={{ background: "var(--danger)" }}
                                    type="button"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel p-4">
            <p className="section-kicker">Danger zone</p>
            <h3 className="text-lg font-semibold">Delete account</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              This deletes your saved account data, subjects, books, tasks, and history from this
              device.
            </p>
            <button
              className="pill-button mt-4 w-full text-sm text-white"
              onClick={deleteAccount}
              style={{ background: "var(--danger)" }}
              type="button"
            >
              Delete account
            </button>
          </section>
        </section>
      ) : null}
    </main>
  );
}
