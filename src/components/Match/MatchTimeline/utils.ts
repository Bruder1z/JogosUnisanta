import { COURSE_EMBLEMS, type Match, type MatchEvent } from "../../../data/mockData";

type EventIconContext = {
  isBasketball: boolean;
  isBeachTennis: boolean;
  isVolleyball: boolean;
  isTamboreu: boolean;
  isKarate: boolean;
  isJudo: boolean;
};

type BasketballTimelineEvent = {
  minute: number;
  teamId?: string;
  player?: string;
  description?: string;
  timelineScore?: string;
};

type EventLabelContext = {
  selectedMatch: Match | null | undefined;
  isBasketball: boolean;
  isHandebol: boolean;
  isFutebolX1: boolean;
  isFutsal: boolean;
  isFutebolSociety: boolean;
  isBeachTennis: boolean;
  isVolleyball: boolean;
  isTamboreu: boolean;
  isKarate: boolean;
  isJudo: boolean;
  isSwimming: boolean;
};

type TimelineEventLike = MatchEvent & {
  timelineScore?: string;
};

type TimelineScoreContext = {
  selectedMatch: Match | null | undefined;
  isSwimming: boolean;
  isBasketball: boolean;
  isBeachTennis: boolean;
  isSetSport: boolean;
  isTamboreu: boolean;
  isKarate: boolean;
  isJudo: boolean;
};

type AthleteLike = {
  course: string;
  institution: string;
  sex?: string;
  sports?: unknown;
};

type TeamLike = Match["teamA"];

type BeachGamePoints = {
  ptsA: number;
  ptsB: number;
  isTiebreak: boolean;
};

const normalizeSex = (value?: string) => (value || "").trim().toLowerCase();
const normalizeSport = (value?: string) => (value || "").trim().toLowerCase();

const toSportList = (sports: unknown): string[] => {
  if (Array.isArray(sports)) {
    return sports.map((sport) => String(sport).trim()).filter(Boolean);
  }

  if (typeof sports === "string") {
    return sports
      .split(",")
      .map((sport) => sport.trim())
      .filter(Boolean);
  }

  return [];
};

const athleteHasSport = (athlete: AthleteLike, sport: string) => {
  const targetSport = normalizeSport(sport);
  return toSportList(athlete.sports).some(
    (athleteSport) => normalizeSport(athleteSport) === targetSport,
  );
};

export const getTeamShortName = (team: TeamLike | null | undefined) => {
  if (!team) return "";
  return team.name.split(" - ")[0] || team.name;
};

export const getTeamSuffixName = (team: TeamLike | null | undefined) => {
  if (!team) return "";
  return team.name.split(" - ")[1] || "";
};

export const getMatchTeamShortName = (
  match: Match | null | undefined,
  side: "A" | "B",
) => {
  if (!match) return "";
  return side === "A"
    ? getTeamShortName(match.teamA)
    : getTeamShortName(match.teamB);
};

export const getMatchTeamSuffixName = (
  match: Match | null | undefined,
  side: "A" | "B",
) => {
  if (!match) return "";
  return side === "A"
    ? getTeamSuffixName(match.teamA)
    : getTeamSuffixName(match.teamB);
};

export const getBasketballQuarterDurationSeconds = (match: Match | null) => {
  if (!match) return 15 * 60;
  if (match.sport === "Basquete 3x3") return 10 * 60;
  return match.category === "Feminino" ? 10 * 60 : 15 * 60;
};

export const getBeachCurrentGamePoints = (match: Match): BeachGamePoints => {
  const events = match.events || [];
  const isTiebreak = [...events].some(
    (event) => event.type === "halftime" && event.description?.startsWith("🎾 Início do Tie-break"),
  );

  const lastGameWinIdx = [...events]
    .map((event, index) => ({ event, index }))
    .reverse()
    .find(({ event }) => event.type === "set_win" && event.description?.startsWith("Game para "))?.index ?? -1;

  const relevantEvents = lastGameWinIdx === -1 ? events : events.slice(lastGameWinIdx + 1);
  const ptsA = relevantEvents.filter(
    (event) => event.type === "goal" && event.teamId === match.teamA.id,
  ).length;
  const ptsB = relevantEvents.filter(
    (event) => event.type === "goal" && event.teamId === match.teamB.id,
  ).length;

  return { ptsA, ptsB, isTiebreak };
};

export const getVolleyballCurrentSetPoints = (match: Match) => {
  const events = match.events || [];
  const lastSetWinEvent = [...events].reverse().find((event) => event.type === "set_win");
  const relevantEvents = lastSetWinEvent
    ? events.slice(events.indexOf(lastSetWinEvent) + 1)
    : events;

  const ptsA = relevantEvents.filter(
    (event) => event.type === "goal" && event.teamId === match.teamA.id,
  ).length;
  const ptsB = relevantEvents.filter(
    (event) => event.type === "goal" && event.teamId === match.teamB.id,
  ).length;

  return { ptsA, ptsB };
};

export const getMatchInitialMinute = (match: Match) => {
  if (
    match.sport === "Basquetebol" ||
    match.sport === "Basquete 3x3" ||
    match.sport === "Caratê" ||
    match.sport === "Judô"
  ) {
    const sortedEvents = [...(match.events || [])].sort(compareTimelineEventsAsc);
    const lastEvent = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1] : null;
    const durationSeconds =
      match.sport === "Caratê"
        ? 180
        : match.sport === "Judô"
          ? 240
          : getBasketballQuarterDurationSeconds(match);

    return lastEvent && lastEvent.minute !== undefined
      ? lastEvent.minute
      : durationSeconds;
  }

  const lastMinute = (match.events || []).reduce(
    (max, event) => Math.max(max, event.minute || 0),
    0,
  );

  return lastMinute * 60;
};

export const athleteMatchesTeamAndMatch = (
  athlete: AthleteLike,
  team: TeamLike,
  selectedMatch: Match | null | undefined,
) => {
  if (!selectedMatch) return false;

  const athleteCourse = athlete.course.toLowerCase();
  const athleteInst = athlete.institution.toLowerCase();
  const teamCourse = (team.course || "").toLowerCase();
  const teamFaculty = (team.faculty || "").toLowerCase();

  const isFefespMatch =
    (teamCourse.includes("fefesp") || teamCourse.includes("educação física")) &&
    (athleteCourse.includes("fefesp") ||
      athleteCourse.includes("educação física") ||
      athleteInst.includes("fefesp"));

  const courseMatch =
    athleteCourse.includes(teamCourse) || teamCourse.includes(athleteCourse);
  const facultyMatch =
    athleteInst.includes(teamFaculty) || teamFaculty.includes(athleteInst);

  const sameTeam = isFefespMatch || (courseMatch && facultyMatch);
  const sameSport = athleteHasSport(athlete, selectedMatch.sport);
  const sameSex =
    !athlete.sex ||
    normalizeSex(athlete.sex) === normalizeSex(selectedMatch.category);

  return sameTeam && sameSport && sameSex;
};

export const getTeamEmblem = (team: Match["teamA"] | string | null | undefined) => {
  if (!team) return null;
  if (typeof team === "object" && team.logo) return team.logo;

  const possibleKeys: string[] = [];
  let identifiedCourse = "";
  let identifiedFaculty = "";

  if (typeof team === "string") {
    possibleKeys.push(team);
    if (team.includes(" - ")) {
      [identifiedCourse, identifiedFaculty] = team.split(" - ");
    } else {
      identifiedCourse = team;
    }
  } else {
    if (team.name) {
      possibleKeys.push(team.name);
      if (team.name.includes(" - ") && (!team.course || !team.faculty)) {
        const [course, faculty] = team.name.split(" - ");
        identifiedCourse = course;
        identifiedFaculty = faculty;
      }
    }

    if (team.course && team.faculty) {
      possibleKeys.push(`${team.course} - ${team.faculty}`);
      identifiedCourse = identifiedCourse || team.course;
      identifiedFaculty = identifiedFaculty || team.faculty;
    }

    if (team.course) {
      possibleKeys.push(team.course);
      identifiedCourse = identifiedCourse || team.course;
    }

    if (team.name && team.name.includes(" - ")) {
      const firstPart = team.name.split(" - ")[0];
      possibleKeys.push(firstPart);
      identifiedCourse = identifiedCourse || firstPart;
    }
  }

  const emblemKeys = Object.keys(COURSE_EMBLEMS);

  for (const possibleKey of possibleKeys) {
    const normalizedKey = String(possibleKey).trim().toLowerCase();
    if (!normalizedKey) continue;

    const exactKey = emblemKeys.find((key) => key.toLowerCase() === normalizedKey);
    if (exactKey) return `/emblemas/${COURSE_EMBLEMS[exactKey]}`;
  }

  if (identifiedCourse && identifiedFaculty) {
    const courseLow = identifiedCourse.toLowerCase();
    const facultyLow = identifiedFaculty.toLowerCase();
    const bestKey = emblemKeys.find((key) => {
      const keyLow = key.toLowerCase();
      return keyLow.includes(courseLow) && keyLow.includes(facultyLow);
    });

    if (bestKey) return `/emblemas/${COURSE_EMBLEMS[bestKey]}`;
  }

  return null;
};

export const parseSwimmingTimeParts = (value: string) => {
  const match = value.match(/^(\d{0,2}):(\d{0,2})\.(\d{0,2})$/);
  if (match) return { mm: match[1], ss: match[2], cc: match[3] };
  return { mm: "", ss: "", cc: "" };
};

export const normalizeSwimmingTime = (value: string) => {
  const { mm, ss, cc } = parseSwimmingTimeParts(value);
  if (!mm && !ss && !cc) return "";
  return `${mm.padStart(2, "0")}:${ss.padStart(2, "0")}.${cc.padStart(2, "0")}`;
};

export const hasSwimmingTime = (value: string) => /\d/.test(value);

export const sanitizeSwimmingTime = (mm: string, ss: string, cc: string) => {
  const rawMM = parseInt(mm || "0", 10);
  const rawSS = parseInt(ss || "0", 10);
  const rawCC = Math.min(parseInt(cc || "0", 10), 99);
  const totalSeconds = rawMM * 60 + rawSS;
  const finalMM = Math.min(Math.floor(totalSeconds / 60), 99);
  const finalSS = totalSeconds % 60;
  return {
    mm: String(finalMM).padStart(2, "0"),
    ss: String(finalSS).padStart(2, "0"),
    cc: String(rawCC).padStart(2, "0"),
  };
};

export const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const getEventTimestamp = (eventId: string) => {
  const raw = eventId.split("_")[1] || eventId;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const compareTimelineEventsAsc = (a: MatchEvent, b: MatchEvent) => {
  const timestampA = getEventTimestamp(a.id);
  const timestampB = getEventTimestamp(b.id);

  if (timestampA !== 0 || timestampB !== 0) {
    const timestampDiff = timestampA - timestampB;
    if (timestampDiff !== 0) return timestampDiff;
  }

  const minuteDiff = a.minute - b.minute;
  if (minuteDiff !== 0) return minuteDiff;

  const isDoubleYellowPair =
    a.player &&
    b.player &&
    a.player === b.player &&
    a.teamId === b.teamId &&
    ((a.type === "yellow_card" && b.type === "red_card") ||
      (a.type === "red_card" && b.type === "yellow_card"));

  if (isDoubleYellowPair) {
    return a.type === "yellow_card" ? -1 : 1;
  }

  return getEventTimestamp(a.id) - getEventTimestamp(b.id);
};

export const getBeachScoreState = (match: Match | null) => {
  const initialState = {
    gamePointsA: 0,
    gamePointsB: 0,
  };

  if (!match) return initialState;

  return [...(match.events || [])]
    .sort(compareTimelineEventsAsc)
    .reduce((state, event) => {
      if (event.type === "set_win") {
        return {
          ...state,
          gamePointsA: 0,
          gamePointsB: 0,
        };
      }

      if (event.type !== "goal") {
        return state;
      }

      return {
        ...state,
        gamePointsA:
          event.teamId === match.teamA.id
            ? state.gamePointsA + 1
            : state.gamePointsA,
        gamePointsB:
          event.teamId === match.teamB.id
            ? state.gamePointsB + 1
            : state.gamePointsB,
      };
    }, initialState);
};

export const getStoredSwimmingParticipants = (match: Match | null | undefined) => {
  if (!match?.participants) return [] as Match["teamA"][];
  if (Array.isArray(match.participants)) return match.participants;
  if (typeof match.participants === "string") {
    try {
      const parsed = JSON.parse(match.participants) as Match["teamA"][];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [] as Match["teamA"][];
};

export const getSwimmingEntries = (match: Match | null | undefined) => {
  const participants = getStoredSwimmingParticipants(match);
  if (!match || participants.length === 0) {
    return [] as Array<{
      id: string;
      participant: Match["teamA"];
      defaultName: string;
    }>;
  }

  return participants.map((participant) => ({
    id: participant.id,
    participant,
    defaultName: "",
  }));
};

export const getTimelineScoreLabel = (
  events: MatchEvent[],
  context: TimelineScoreContext,
) => {
  const {
    selectedMatch,
    isSwimming,
    isBasketball,
    isBeachTennis,
    isSetSport,
    isTamboreu,
    isKarate,
    isJudo,
  } = context;

  if (!selectedMatch) return [] as Array<TimelineEventLike & { timelineQuarter?: string }>;

  const BEACH_POINT_LABELS = ["0", "15", "30", "40"];

  let regularScoreA = 0;
  let regularScoreB = 0;
  let setScoreA = 0;
  let setScoreB = 0;
  let setPointsA = 0;
  let setPointsB = 0;
  let beachGamesA = 0;
  let beachGamesB = 0;
  let beachPointsA = 0;
  let beachPointsB = 0;
  let basketballQuarter = 1;

  const mappedEvents = [...events]
    .sort(compareTimelineEventsAsc)
    .map((event) => {
      const timelineQuarter = isBasketball
        ? `Q${basketballQuarter}`
        : undefined;

      if (isSwimming) {
        return {
          ...event,
          timelineScore: "",
          timelineQuarter,
        };
      }

      if (isBeachTennis) {
        if (event.type === "goal") {
          if (event.teamId === selectedMatch.teamA.id) beachPointsA += 1;
          if (event.teamId === selectedMatch.teamB.id) beachPointsB += 1;
        }

        if (
          event.type === "set_win" &&
          event.description?.startsWith("Game para ")
        ) {
          if (event.teamId === selectedMatch.teamA.id) beachGamesA += 1;
          if (event.teamId === selectedMatch.teamB.id) beachGamesB += 1;
          beachPointsA = 0;
          beachPointsB = 0;
        }

        if (event.type === "halftime" && event.description?.startsWith("🎾 Início do Tie-break")) {
          beachPointsA = 0;
          beachPointsB = 0;
        }

        const inTiebreak = events
          .slice(0, events.indexOf(event) + 1)
          .some((item) => item.type === "halftime" && item.description?.startsWith("🎾 Início do Tie-break"));

        const ptLabelA = inTiebreak ? String(beachPointsA) : (BEACH_POINT_LABELS[Math.min(beachPointsA, 3)] ?? "0");
        const ptLabelB = inTiebreak ? String(beachPointsB) : (BEACH_POINT_LABELS[Math.min(beachPointsB, 3)] ?? "0");

        return {
          ...event,
          timelineScore: `Games ${beachGamesA}x${beachGamesB} | ${inTiebreak ? "Tie-break" : "Pontos"} ${ptLabelA}-${ptLabelB}`,
          timelineQuarter,
        };
      }

      if (isSetSport) {
        if (event.type === "goal") {
          if (event.teamId === selectedMatch.teamA.id) setPointsA += 1;
          if (event.teamId === selectedMatch.teamB.id) setPointsB += 1;
        }

        if (event.type === "set_win") {
          if (event.teamId === selectedMatch.teamA.id) setScoreA += 1;
          if (event.teamId === selectedMatch.teamB.id) setScoreB += 1;
          setPointsA = 0;
          setPointsB = 0;
        }

        return {
          ...event,
          timelineScore: `Sets ${setScoreA}x${setScoreB} | Pontos ${setPointsA}-${setPointsB}`,
          timelineQuarter,
        };
      }

      if (isTamboreu) {
        if (event.type === "goal") {
          if (event.teamId === selectedMatch.teamA.id) setPointsA += 1;
          if (event.teamId === selectedMatch.teamB.id) setPointsB += 1;
        }

        if (event.type === "set_win") {
          if (event.teamId === selectedMatch.teamA.id) setScoreA += 1;
          if (event.teamId === selectedMatch.teamB.id) setScoreB += 1;
          setPointsA = 0;
          setPointsB = 0;
        }

        return {
          ...event,
          timelineScore: event.type === "goal"
            ? `🎾 ${setPointsA} x ${setPointsB}`
            : "",
          timelineQuarter,
        };
      }

      if (
        event.type === "goal" ||
        event.type === "penalty_scored" ||
        event.type === "shootout_scored"
      ) {
        const increment = isBasketball || isKarate || isJudo
          ? Number(event.description?.match(/\+(\d+)/)?.[1] || 1)
          : 1;

        if (event.teamId === selectedMatch.teamA.id) regularScoreA += increment;
        if (event.teamId === selectedMatch.teamB.id) regularScoreB += increment;
      }

      const mappedEvent: TimelineEventLike & { timelineQuarter?: string } = {
        ...event,
        timelineScore: `${regularScoreA}x${regularScoreB}`,
        timelineQuarter,
      };

      if (isBasketball && event.type === "halftime") {
        basketballQuarter += 1;
      }

      return mappedEvent;
    });

  if (isSwimming) {
    return mappedEvents;
  }

  return mappedEvents.reverse().map((event) => {
    if (!isBasketball) return event;

    const descriptionHasQuarter = event.description?.includes("[Q");
    if (
      event.type !== "goal" ||
      !event.description ||
      descriptionHasQuarter ||
      !event.timelineQuarter
    ) {
      return event;
    }

    return {
      ...event,
      description: `[${event.timelineQuarter}] ${event.description}`,
    };
  });
};

export const getEventIcon = (
  type: string,
  context: EventIconContext,
) => {
  const {
    isBasketball,
    isBeachTennis,
    isVolleyball,
    isTamboreu,
    isKarate,
    isJudo,
  } = context;

  switch (type) {
    case "goal":
      if (isBasketball) return "🏀";
      if (isBeachTennis) return "🎾";
      if (isVolleyball) return "🏐";
      if (isTamboreu) return "🎾";
      if (isKarate || isJudo) return "🥋";
      return "⚽";
    case "swimming_result":
      return "🏊";
    case "yellow_card":
      return "🟨";
    case "red_card":
      return "🟥";
    case "start":
      return "▶️";
    case "end":
      return "🏁";
    case "halftime":
      if (isBeachTennis) return "🎾";
      return "⏸️";
    case "penalty_scored":
      return "⚽";
    case "penalty_missed":
      return "❌";
    case "shootout_scored":
      return "⚽";
    case "shootout_missed":
      return "❌";
    case "set_win":
      if (isBeachTennis) return "🎾";
      if (isVolleyball) return "🏐";
      return "🎾";
    case "tie_break_start":
      return "🎾";
    case "senshu":
      return "⭐";
    case "chui":
      return "⚠️";
    case "hansoku":
      return "🛑";
    case "waza_ari":
      return "🟡";
    case "ippon":
      return "🔴";
    case "shido":
      return "⚠️";
    case "hansoku_make":
      return "🛑";
    case "osaekomi":
      return "⏲️";
    case "toketa":
      return "🔌";
    default:
      return "•";
  }
};

export const getBasketballEventData = (
  event: BasketballTimelineEvent,
  selectedMatch: Match | null | undefined,
) => {
  const pointValue = Number(event.description?.match(/\+(\d+)/)?.[1] || 1);
  const totalSeconds = Math.max(0, event.minute);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const teamName = !selectedMatch
    ? "Faculdade"
    : event.teamId === selectedMatch.teamA.id
      ? selectedMatch.teamA.name.split(" - ")[0]
      : event.teamId === selectedMatch.teamB.id
        ? selectedMatch.teamB.name.split(" - ")[0]
        : "Faculdade";

  const playerLabel = event.player
    ? `🏀 ${event.player} +${pointValue}pts`
    : `+${pointValue} ${pointValue > 1 ? "pontos" : "ponto"} para ${teamName}`;

  return {
    tempo: `${minutes}:${String(seconds).padStart(2, "0")}`,
    pontuacaoLabel: playerLabel,
    placar: (event.timelineScore || "0x0").replace("x", "-"),
  };
};

export const getEventLabel = (
  event: TimelineEventLike,
  context: EventLabelContext,
) => {
  const {
    selectedMatch,
    isBasketball,
    isHandebol,
    isFutebolX1,
    isFutsal,
    isFutebolSociety,
    isBeachTennis,
    isVolleyball,
    isTamboreu,
    isKarate,
    isJudo,
    isSwimming,
  } = context;

  const teamName = !selectedMatch
    ? ""
    : event.teamId === selectedMatch.teamA.id
      ? selectedMatch.teamA.name
      : event.teamId === selectedMatch.teamB.id
        ? selectedMatch.teamB.name
        : "";

  const stripPlayerNameFromLabel = (label: string) => {
    if (!event.player) return label;
    if (isBasketball && event.type === "goal") return label;
    if (isHandebol && event.type === "goal") return label;
    if (isFutebolX1) return label;
    if (isFutsal) return label;
    if (isFutebolSociety) return label;

    return label
      .replace(` - ${event.player}`, "")
      .replace(`(${event.player})`, "")
      .replace(new RegExp(`\\s${event.player}$`), "")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const keepScoreTogether = (label: string) =>
    label.replace(/(\d+)\s*x\s*(\d+)/g, "$1\u00A0x\u00A0$2");

  let label = "";
  switch (event.type) {
    case "goal":
      if (isBasketball) {
        if (event.player) {
          const pts = event.description?.match(/\+(\d+)pts/)?.[1]
            ?? event.description?.match(/\+(\d+)\s*Ponto/)?.[1];
          const teamShort = teamName.split(" - ")[0];
          label = pts
            ? `🏀 ${event.player} +${pts}pts (${teamShort})`
            : `🏀 ${event.player} (${teamShort})`;
        } else {
          label = event.description || "";
        }
        break;
      }
      if (isHandebol) {
        const teamShortName = teamName.split(" - ")[0] || teamName;
        label = event.player
          ? `GOL! ${teamShortName} - ${event.player}`
          : `GOL! ${teamShortName}`;
        break;
      }
      if (isVolleyball) {
        if (event.player && event.player.trim()) {
          const teamShort = teamName.split(" - ")[0];
          label = `🏐 ${event.player} (${teamShort})`;
        } else {
          label = event.description || `Ponto - ${teamName}`;
        }
        break;
      }
      if (isTamboreu) {
        label = event.description || `🎾 Ponto - ${teamName}`;
        break;
      }
      if (isFutebolSociety && event.player) {
        label = `GOL! ${event.player}`;
        break;
      }
      if (isFutsal && event.player) {
        label = `GOL! ${event.player}`;
        break;
      }
      if (event.description) {
        label = event.description;
        break;
      }
      if (isFutebolX1) {
        const currentScore = event.timelineScore || "0x0";
        const athleteInfo = event.player
          ? `${event.player} (${teamName})`
          : teamName;
        label = `⚽ GOL! Placar no momento: ${currentScore} - ${athleteInfo}`;
        break;
      }
      if (isKarate || isJudo) {
        label = `Ponto para ${teamName.split(" - ")[0]}`;
        break;
      }
      label = `${isHandebol ? "GOL!" : "GOL!"} ${teamName}`;
      break;
    case "yellow_card":
      if (event.description) {
        label = event.description;
        break;
      }
      if (isFutebolSociety && event.player) {
        label = `Cartão Amarelo - ${event.player} (${teamName})`;
        break;
      }
      if (isFutsal && event.player) {
        label = `Cartão Amarelo - ${event.player} (${teamName})`;
        break;
      }
      if (isFutebolX1 && event.player) {
        label = `Cartão Amarelo - ${event.player} (${teamName})`;
        break;
      }
      label = `Cartão Amarelo - ${teamName}`;
      break;
    case "red_card":
      if (event.description) {
        label = event.description;
        break;
      }
      if (isFutebolSociety && event.player) {
        label = `Cartão Vermelho - ${event.player} (${teamName})`;
        break;
      }
      if (isFutsal && event.player) {
        label = `Cartão Vermelho - ${event.player} (${teamName})`;
        break;
      }
      if (isFutebolX1 && event.player) {
        label = `Cartão Vermelho - ${event.player} (${teamName})`;
        break;
      }
      label = `Cartão Vermelho - ${teamName}`;
      break;
    case "penalty_scored":
      if (isFutebolX1) {
        const currentScore = event.timelineScore || "0x0";
        const athleteInfo = event.player
          ? `${event.player} (${teamName.split(" - ")[0]})`
          : teamName.split(" - ")[0];
        label = `🎯 Gol de Pênalti! Placar no momento: ${currentScore} - ${athleteInfo}`;
        break;
      }
      label = `${isHandebol ? "TIRO DE 7 METROS" : "Gol de Pênalti"} - ${teamName}`;
      break;
    case "penalty_missed": {
      const playerInfo = event.player && event.player !== "Pênalti perdido"
        ? ` - ${event.player}`
        : "";
      if (isFutebolX1) {
        const currentScore = event.timelineScore || "0x0";
        const athleteInfo = event.player
          ? `${event.player} (${teamName.split(" - ")[0]})`
          : teamName.split(" - ")[0];
        label = `❌ Pênalti Perdido! Placar no momento: ${currentScore} - ${athleteInfo}`;
        break;
      }
      label = `${isHandebol ? "TIRO DE 7 METROS" : "Pênalti"} Perdido - ${teamName}${playerInfo}`;
      break;
    }
    case "shootout_scored":
      if (event.description) {
        label = event.description;
        break;
      }
      if (isFutebolX1) {
        const currentScore = event.timelineScore || "0x0";
        const athleteInfo = event.player
          ? `${event.player} (${teamName})`
          : teamName;
        label = `🎯 Shoot-out Marcado! Placar no momento: ${currentScore} - ${athleteInfo}`;
        break;
      }
      label = `🎯 Shoot-out Marcado - ${teamName}`;
      break;
    case "shootout_missed":
      if (event.description) {
        label = event.description;
        break;
      }
      if (isFutebolX1) {
        const currentScore = event.timelineScore || "0x0";
        label = `❌ Shoot-out Perdido! Placar no momento: ${currentScore} - ${teamName.split(" - ")[0]}`;
        break;
      }
      label = `❌ Shoot-out Perdido - ${teamName}`;
      break;
    case "set_win":
      if (isBeachTennis) {
        label = event.description || `Game para ${teamName}`;
        break;
      }
      label = event.description || `Set ganho por ${teamName}`;
      break;
    case "tie_break_start":
      label = "Início de Tie-break";
      break;
    case "waza_ari":
      label = event.description || `Waza-ari para ${teamName}`;
      break;
    case "ippon":
      label = event.description || `IPPON! Vitória para ${teamName}`;
      break;
    case "shido":
      label = event.description || `Shido para ${teamName}`;
      break;
    case "hansoku_make":
      label = event.description || `HANSOKU-MAKE! Vitória para ${teamName}`;
      break;
    case "start":
      label = isJudo || isKarate ? "Início da luta" : "Início da partida";
      break;
    case "halftime":
      label = event.description || "Intervalo";
      break;
    case "end":
      label =
        isSwimming && event.description
          ? event.description
          : isJudo
            ? "Fim de luta"
            : "Fim de jogo";
      break;
    case "swimming_result":
      label = event.description || "Resultado da prova";
      break;
    default:
      label = event.description || event.type;
      break;
  }

  return keepScoreTogether(stripPlayerNameFromLabel(label));
};
