const RESET_HOUR = 4;
const COOLDOWN_DAYS = 3;

export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getGameDate(date) {
  const gameDate = new Date(date);
  if (gameDate.getHours() < RESET_HOUR)
    gameDate.setDate(gameDate.getDate() - 1);
  return toDateInputValue(gameDate);
}

export function getNextAvailableAt(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day + COOLDOWN_DAYS, RESET_HOUR);
}

export function formatCountdown(availableAt, now = Date.now()) {
  const totalSeconds = Math.max(
    0,
    Math.floor((availableAt.getTime() - now) / 1000),
  );
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return days > 0
    ? `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`
    : `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export function formatShortDate(value) {
  const date =
    typeof value === "string"
      ? new Date(
          ...value
            .split("-")
            .map((part, index) => Number(part) - (index === 1 ? 1 : 0)),
        )
      : value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(date)
    .replace(".", "");
}
