export type TaskStatus = "not_done" | "in_progress" | "done";

export type ViewName = "today" | "history" | "settings";

export interface Subject {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  subjectId: string;
  name: string;
  pageCount: number | null;
}

export interface Task {
  id: string;
  date: string;
  subjectId: string;
  bookId: string;
  page: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  carriedFromTaskId?: string;
}

export interface DayRecord {
  date: string;
  createdAt: string;
}

export interface TrackerData {
  subjects: Subject[];
  books: Book[];
  tasks: Task[];
  days: DayRecord[];
}

export interface TaskDraft {
  subjectId: string;
  bookId: string;
  page: string;
}

export const STORAGE_KEY = "homeschool-daily-tracker";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateKey() {
  return formatDateKey(new Date());
}

export function shiftDate(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + amount);
  return formatDateKey(nextDate);
}

export function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isPastDay(dateKey: string, todayDateKey: string) {
  return dateKey < todayDateKey;
}

function parsePageCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === "string") {
    const numericValue = Number.parseInt(value, 10);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue;
    }
  }

  return null;
}

export function createDefaultData(todayDateKey: string): TrackerData {
  const subjectArabic = createId();
  const subjectIslamicStudies = createId();
  const subjectMath = createId();
  const subjectEnglish = createId();
  const now = new Date().toISOString();

  return {
    subjects: [
      { id: subjectIslamicStudies, name: "Islamic Studies" },
      { id: subjectArabic, name: "Arabic" },
      { id: subjectMath, name: "Math" },
      { id: subjectEnglish, name: "English" },
    ],
    books: [
      { id: createId(), subjectId: subjectIslamicStudies, name: "Foundations of Faith", pageCount: 120 },
      { id: createId(), subjectId: subjectArabic, name: "Arabic Workbook 1", pageCount: 80 },
      { id: createId(), subjectId: subjectMath, name: "Math Practice Book", pageCount: 160 },
      { id: createId(), subjectId: subjectEnglish, name: "Reading and Writing", pageCount: 140 },
    ],
    tasks: [],
    days: [{ date: todayDateKey, createdAt: now }],
  };
}

export function normalizeTrackerData(input: TrackerData, todayDateKey: string): TrackerData {
  const subjects = [...input.subjects].sort((left, right) => left.name.localeCompare(right.name));
  const books = [...input.books]
    .map((book) => ({
      id: book.id,
      subjectId: book.subjectId,
      name: book.name,
      pageCount: parsePageCount((book as Book & { pageCount?: unknown }).pageCount),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const tasks = input.tasks.map((task) => ({
    id: task.id,
    date: task.date,
    subjectId: task.subjectId,
    bookId: task.bookId,
    page: task.page?.trim?.() ?? "",
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    carriedFromTaskId: task.carriedFromTaskId,
  }));
  const daysByDate = new Map<string, DayRecord>();

  input.days.forEach((day) => {
    daysByDate.set(day.date, day);
  });
  tasks.forEach((task) => {
    if (!daysByDate.has(task.date)) {
      daysByDate.set(task.date, { date: task.date, createdAt: task.createdAt });
    }
  });
  if (!daysByDate.has(todayDateKey)) {
    daysByDate.set(todayDateKey, { date: todayDateKey, createdAt: new Date().toISOString() });
  }

  return {
    subjects,
    books,
    tasks,
    days: [...daysByDate.values()].sort((left, right) => left.date.localeCompare(right.date)),
  };
}

export function ensureDayExists(data: TrackerData, dateKey: string): TrackerData {
  if (data.days.some((day) => day.date === dateKey)) {
    return data;
  }

  const now = new Date().toISOString();
  const previousDate = shiftDate(dateKey, -1);
  const carriedTasks = data.tasks
    .filter(
      (task) =>
        task.date === previousDate &&
        (task.status === "not_done" || task.status === "in_progress"),
    )
    .map((task) => ({
      ...task,
      id: createId(),
      date: dateKey,
      createdAt: now,
      updatedAt: now,
      carriedFromTaskId: task.id,
    }));

  return {
    ...data,
    tasks: [...data.tasks, ...carriedTasks],
    days: [...data.days, { date: dateKey, createdAt: now }].sort((left, right) =>
      left.date.localeCompare(right.date),
    ),
  };
}

export function createTask(dateKey: string, draft: TaskDraft): Task {
  const now = new Date().toISOString();

  return {
    id: createId(),
    date: dateKey,
    subjectId: draft.subjectId,
    bookId: draft.bookId,
    page: draft.page.trim(),
    status: "not_done",
    createdAt: now,
    updatedAt: now,
  };
}

export function emptyTaskDraft(): TaskDraft {
  return {
    subjectId: "",
    bookId: "",
    page: "",
  };
}

export function sortTasks(tasks: Task[]) {
  const statusOrder: Record<TaskStatus, number> = {
    not_done: 0,
    in_progress: 1,
    done: 2,
  };

  return [...tasks].sort((left, right) => {
    const statusDifference = statusOrder[left.status] - statusOrder[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function getBooksForSubject(data: TrackerData, subjectId: string) {
  return data.books.filter((book) => book.subjectId === subjectId);
}

export function getSubjectName(data: TrackerData, subjectId: string) {
  return data.subjects.find((subject) => subject.id === subjectId)?.name ?? "Unknown subject";
}

export function getBook(data: TrackerData, bookId: string) {
  return data.books.find((book) => book.id === bookId);
}

export function getBookName(data: TrackerData, bookId: string) {
  return getBook(data, bookId)?.name ?? "Deleted book";
}

export function countDoneTasks(tasks: Task[]) {
  return tasks.filter((task) => task.status === "done").length;
}
