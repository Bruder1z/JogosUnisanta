import { type FC, useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  Trophy,
} from "lucide-react";
import {
  type Match,
  type MatchEvent,
  COURSE_EMBLEMS,
} from "../../../data/mockData";
import { type MatchMvpCandidateInput, useData } from "../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import PlayerStats from "../PlayerStats";
import { MatchModalHeader } from "./MatchModalHeader";
import { MatchModalActions } from "./MatchModalActions";
import { MatchModalSetBreakdown } from "./MatchModalSetBreakdown";
import { MatchModalMvpPanel } from "./MatchModalMvpPanel";

import "./MatchModal.css";

interface MatchModalProps {
  match: Match;
  onClose: () => void;
}

const MatchModal: FC<MatchModalProps> = ({ match: initialMatch, onClose }) => {
  const {
    matches: allMatches,
    mvpCandidates,
    ensureMatchMvpCandidates,
    hasUserVotedMatch,
    voteMatchMvpCandidate,
  } = useData();
  const { user, openLoginModal } = useAuth();
  const [currentMatch, setCurrentMatch] = useState<Match>(initialMatch);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [isSavingMvpCandidates, setIsSavingMvpCandidates] = useState(false);
  const [mvpCandidatesLoadError, setMvpCandidatesLoadError] = useState<string | null>(null);
  const [isVotingCandidateId, setIsVotingCandidateId] = useState<string | null>(null);
  const [mvpVoteFeedback, setMvpVoteFeedback] = useState<string | null>(null);
  const [isMvpVotingActive, setIsMvpVotingActive] = useState(false);
  const [mvpVotingSecondsRemaining, setMvpVotingSecondsRemaining] = useState(60);
  const attemptedMvpSeedMatchIdsRef = useRef<Set<string>>(new Set());

  // ── Timer ao vivo sincronizado com o admin ───────────────────────────────
  // Estratégia:
  // 1. Lê o último evento pause/resume para saber se está pausado
  // 2. Se pausado: congela no minute do evento pause
  // 3. Se rodando: pega o último evento resume (ou start) + elapsed desde então
  const [liveTimerSeconds, setLiveTimerSeconds] = useState<number | null>(null);
  const [timerPaused, setTimerPaused] = useState(false);

  const isTimerCountdown =
    currentMatch.sport === "Basquetebol" ||
    currentMatch.sport === "Basquete 3x3" ||
    currentMatch.sport === "Caratê" ||
    currentMatch.sport === "Judô";

  const NO_TIMER_SPORTS = new Set([
    "Vôlei",
    "Vôlei de Praia",
    "Tênis de Mesa",
    "Futevôlei",
    "Beach Tennis",
    "Natação",
    "Xadrez",
    "Tamboréu",
  ]);

  const getQuarterDuration = (match: Match): number => {
    if (match.sport === "Caratê") return 180;
    if (match.sport === "Judô") return 240;
    if (match.sport === "Basquete 3x3") return 10 * 60;
    return match.category === "Feminino" ? 10 * 60 : 15 * 60;
  };

  const getEventTs = (eventId: string): number => {
    const raw = eventId.split("_")[1] || "";
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 1_000_000_000_000 ? parsed : 0;
  };

  const calcSyncedTimer = (match: Match): { seconds: number | null; paused: boolean } => {
    if (NO_TIMER_SPORTS.has(match.sport)) return { seconds: null, paused: false };
    if (match.status !== "live") return { seconds: null, paused: false };

    const events = match.events ?? [];
    const hasStarted = events.some((e) => e.type === "start");
    if (!hasStarted) return { seconds: null, paused: false };

    const sorted = [...events].sort((a, b) => {
      const tsA = getEventTs(a.id);
      const tsB = getEventTs(b.id);
      if (tsA !== tsB) return tsB - tsA;
      return b.minute - a.minute;
    });

    const lastControlEvent = sorted.find(
      (e) => e.type === "pause" || e.type === "resume" || e.type === "start" || e.type === "halftime",
    );

    if (!lastControlEvent) {
      return { seconds: isTimerCountdown ? getQuarterDuration(match) : 0, paused: false };
    }

    const isPaused = lastControlEvent.type === "pause" || lastControlEvent.type === "halftime";
    const savedMinute = lastControlEvent.minute ?? (isTimerCountdown ? getQuarterDuration(match) : 0);

    if (isPaused) {
      return { seconds: savedMinute, paused: true };
    }

    const eventTs = getEventTs(lastControlEvent.id);
    if (eventTs > 0) {
      const elapsedSinceEvent = Math.floor((Date.now() - eventTs) / 1000);
      const current = isTimerCountdown
        ? Math.max(0, savedMinute - elapsedSinceEvent)
        : savedMinute + elapsedSinceEvent;
      return { seconds: current, paused: false };
    }

    return { seconds: savedMinute, paused: false };
  };

  useEffect(() => {
    const { seconds, paused } = calcSyncedTimer(currentMatch);
    setLiveTimerSeconds(seconds);
    setTimerPaused(paused);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentMatch.id,
    currentMatch.status,
    currentMatch.events?.length,
    currentMatch.events?.[currentMatch.events.length - 1]?.id,
  ]);

  useEffect(() => {
    if (liveTimerSeconds === null || currentMatch.status !== "live" || timerPaused) return;
    const interval = window.setInterval(() => {
      setLiveTimerSeconds((prev) => {
        if (prev === null) return null;
        if (isTimerCountdown) return Math.max(0, prev - 1);
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatch.status, isTimerCountdown, timerPaused, liveTimerSeconds !== null]);

  useEffect(() => {
    const liveMatch = allMatches.find((m) => m.id === initialMatch.id);
    if (liveMatch) setCurrentMatch(liveMatch);
  }, [allMatches, initialMatch.id]);

  useEffect(() => {
    if (currentMatch.status !== "finished" || !currentMatch.mvpVotingStartedAt) {
      setIsMvpVotingActive(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - currentMatch.mvpVotingStartedAt!) / 1000);
      const remainingSeconds = Math.max(0, 60 - elapsedSeconds);

      setMvpVotingSecondsRemaining(remainingSeconds);

      if (remainingSeconds <= 0) {
        setIsMvpVotingActive(false);
        clearInterval(interval);
        return;
      }

      setIsMvpVotingActive(true);
    }, 500);

    return () => clearInterval(interval);
  }, [currentMatch.status, currentMatch.mvpVotingStartedAt]);

  const normalizeText = (value?: string) => (value || "").trim().toLowerCase();

  const teamIdentityMatches = (
    teamRef: Match["teamA"],
    teamCandidate: Match["teamA"],
  ) => {
    if (teamRef.id && teamCandidate.id && teamRef.id === teamCandidate.id) return true;

    const refCourse = normalizeText(teamRef.course);
    const candCourse = normalizeText(teamCandidate.course);
    const refFaculty = normalizeText(teamRef.faculty);
    const candFaculty = normalizeText(teamCandidate.faculty);
    const refName = normalizeText(teamRef.name);
    const candName = normalizeText(teamCandidate.name);

    if (refCourse && candCourse && refCourse === candCourse) {
      if (!refFaculty || !candFaculty) return true;
      return refFaculty === candFaculty;
    }

    if (refName && candName && refName === candName) {
      if (!refFaculty || !candFaculty) return true;
      return refFaculty === candFaculty;
    }

    return false;
  };

  const matchHasTeam = (m: Match, teamRef: Match["teamA"]) =>
    teamIdentityMatches(teamRef, m.teamA) || teamIdentityMatches(teamRef, m.teamB);

  const isBeachTennis = currentMatch.sport === "Beach Tennis";
  const isFutsal = currentMatch.sport === "Futsal";
  const isFutebolSociety = currentMatch.sport === "Futebol Society";
  const isTamboreu = currentMatch.sport === "Tamboréu";
  const isSetSport = ["Vôlei", "Vôlei de Praia", "Tênis de Mesa", "Futevôlei"].includes(currentMatch.sport);
  const isVolleyballFamilySport = ["Vôlei", "Vôlei de Praia", "Futevôlei"].includes(currentMatch.sport);
  const isBasketball = currentMatch.sport === "Basquetebol" || currentMatch.sport === "Basquete 3x3";
  const isMvpVotingSport = ["Basquetebol", "Basquete 3x3", "Futebol Society", "Futsal", "Futebol X1", "Handebol", "Vôlei"].includes(currentMatch.sport);
  const isVolleyMvpSport = currentMatch.sport === "Vôlei";
  const isGoalBasedMvpSport = ["Futsal", "Futebol Society", "Futebol X1", "Futebol", "Handebol"].includes(currentMatch.sport);
  const getMvpPerformanceLabel = (value: number) => {
    if (isGoalBasedMvpSport) return value === 1 ? "gol" : "gols";
    return value === 1 ? "ponto" : "pontos";
  };
  const isSwimming = currentMatch.sport === "Natação";
  const isKarate = currentMatch.sport === "Caratê";
  const isJudo = currentMatch.sport === "Judô";
  const isXadrez = currentMatch.sport === "Xadrez";
  const isHandebol = currentMatch.sport === "Handebol";
  const hideTimelineMinute = ["Vôlei", "Vôlei de Praia", "Tênis de Mesa", "Futevôlei", "Beach Tennis", "Natação", "Caratê", "Judô", "Xadrez"].includes(currentMatch.sport);
  const isResultBreakdownSport = isSetSport || isBeachTennis;

  type TimelineEvent = MatchEvent & {
    timelineScore: string;
    timelineQuarter?: string;
  };

  const getSwimmingParticipants = (): Match["teamA"][] => {
    const raw = currentMatch.participants;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as Match["teamA"][];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const swimmingParticipants = isSwimming ? getSwimmingParticipants() : [];

  const getEventTimestamp = (eventId: string) => {
    const raw = eventId.split("_")[1] || eventId;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatLiveTimer = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const getTeamEmblem = (team: any) => {
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

    for (const pk of possibleKeys) {
      const normalizedPk = String(pk).trim().toLowerCase();
      if (!normalizedPk) continue;

      const exactKey = emblemKeys.find((key) => key.toLowerCase() === normalizedPk);
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

  const TeamHeaderDisplay = ({ team }: { team: any }) => {
    const emblemUrl = getTeamEmblem(team);

    return (
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
          {emblemUrl ? (
            <img
              src={emblemUrl}
              alt={team.name}
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
              onError={(event) => {
                event.currentTarget.style.display = "none";
                const fallback = event.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "block";
              }}
            />
          ) : null}
          <div style={{ fontSize: "40px", display: emblemUrl ? "none" : "block" }}>
            {team.logo}
          </div>
        </div>
        <div style={{ fontSize: "18px", fontWeight: 800 }}>
          {team.name.split(" - ")[0]}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {team.name.split(" - ")[1]}
        </div>
      </div>
    );
  };

  void formatLiveTimer;
  void getTeamEmblem;
  void TeamHeaderDisplay;

  const getSetBreakdown = () => {
    if (!isResultBreakdownSport) {
      return [] as Array<{
        setNumber: number;
        winnerTeamName: string;
        scoreA: number;
        scoreB: number;
      }>;
    }

    const events = [...(currentMatch.events || [])].sort(
      (a, b) => a.minute - b.minute || getEventTimestamp(a.id) - getEventTimestamp(b.id),
    );

    const sets: Array<{
      setNumber: number;
      winnerTeamName: string;
      scoreA: number;
      scoreB: number;
    }> = [];
    let currentSetStartIndex = 0;

    events.forEach((event, index) => {
      if (event.type !== "set_win") return;

      if (isBeachTennis && !event.description?.startsWith("Set para ")) return;

      const segmentEvents = events.slice(currentSetStartIndex, index + 1);
      let scoreA = isBeachTennis
        ? segmentEvents.filter(
          (e) =>
            e.type === "set_win" &&
            e.description?.startsWith("Game para ") &&
            e.teamId === currentMatch.teamA.id,
        ).length
        : segmentEvents.filter(
          (e) => e.type === "goal" && e.teamId === currentMatch.teamA.id,
        ).length;
      let scoreB = isBeachTennis
        ? segmentEvents.filter(
          (e) =>
            e.type === "set_win" &&
            e.description?.startsWith("Game para ") &&
            e.teamId === currentMatch.teamB.id,
        ).length
        : segmentEvents.filter(
          (e) => e.type === "goal" && e.teamId === currentMatch.teamB.id,
        ).length;

      if (scoreA === 0 && scoreB === 0 && event.description) {
        const scoreFromDescription = event.description.match(/\((\d+)\s*x\s*(\d+)\)/i);
        if (scoreFromDescription) {
          scoreA = Number(scoreFromDescription[1]);
          scoreB = Number(scoreFromDescription[2]);
        }
      }

      const winnerTeamName =
        event.teamId === currentMatch.teamA.id
          ? currentMatch.teamA.name.split(" - ")[0]
          : event.teamId === currentMatch.teamB.id
            ? currentMatch.teamB.name.split(" - ")[0]
            : "Set encerrado";

      sets.push({
        setNumber: sets.length + 1,
        winnerTeamName,
        scoreA,
        scoreB,
      });

      currentSetStartIndex = index + 1;
    });

    return sets;
  };

  const setBreakdown = getSetBreakdown();

  const beachLiveState = (() => {
    if (!isBeachTennis) {
      return { setsA: 0, setsB: 0, pointA: 0, pointB: 0 };
    }

    const events = [...(currentMatch.events || [])].sort(
      (a, b) => a.minute - b.minute || getEventTimestamp(a.id) - getEventTimestamp(b.id),
    );

    let pointA = 0;
    let pointB = 0;
    let setsA = 0;
    let setsB = 0;

    events.forEach((event) => {
      if (event.type === "goal") {
        if (event.teamId === currentMatch.teamA.id) pointA += 1;
        if (event.teamId === currentMatch.teamB.id) pointB += 1;
      }

      if (event.type === "set_win" && event.description?.startsWith("Game para ")) {
        pointA = 0;
        pointB = 0;
      }

      if (event.type === "set_win" && event.description?.startsWith("Set para ")) {
        if (event.teamId === currentMatch.teamA.id) setsA += 1;
        if (event.teamId === currentMatch.teamB.id) setsB += 1;
        pointA = 0;
        pointB = 0;
      }
    });

    return { setsA, setsB, pointA, pointB };
  })();

  const teamAWins = 0;
  const teamBWins = 0;
  const draws = 0;

  const getTeamForm = (teamRef: Match["teamA"], sport: string) => {
    const teamMatches = allMatches
      .filter(
        (m: Match) =>
          m.status === "finished" &&
          m.id !== currentMatch.id &&
          m.sport === sport &&
          m.category === currentMatch.category &&
          matchHasTeam(m, teamRef),
      )
      .sort((a: Match, b: Match) => {
        const dateA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    return teamMatches.map((m: Match) => {
      const isSlotA = teamIdentityMatches(teamRef, m.teamA);
      const opponent = isSlotA ? m.teamB : m.teamA;
      const myScore = isSlotA ? m.scoreA : m.scoreB;
      const oppScore = isSlotA ? m.scoreB : m.scoreA;

      let result: "win" | "loss" | "draw" = "draw";
      if (myScore > oppScore) result = "win";
      if (myScore < oppScore) result = "loss";

      return { opponent, myScore, oppScore, result };
    });
  };

  const teamAForm = getTeamForm(currentMatch.teamA, currentMatch.sport);
  const teamBForm = getTeamForm(currentMatch.teamB, currentMatch.sport);

  const BEACH_POINT_LABELS = ["0", "15", "30", "40"];

  const getEventsForMvp = () => [...(currentMatch.events || [])];

  const getBasketballEventData = (event: MatchEvent & { timelineScore?: string }) => {
    const pointValue = Number(event.description?.match(/\+(\d+)/)?.[1] || 1);
    const totalSeconds = Math.max(0, event.minute);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const teamName = event.teamId === currentMatch.teamA.id
      ? currentMatch.teamA.name.split(" - ")[0]
      : event.teamId === currentMatch.teamB.id
        ? currentMatch.teamB.name.split(" - ")[0]
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

  const getEventLabel = (event: MatchEvent & { timelineScore?: string }) => {
    const teamName = event.teamId === currentMatch.teamA.id
      ? currentMatch.teamA.name
      : event.teamId === currentMatch.teamB.id
        ? currentMatch.teamB.name
        : "";

    switch (event.type) {
      case "goal":
        if (event.description) return event.description;
        if (isFutebolSociety && event.player) return `GOL! ${event.player}`;
        if (isFutsal && event.player) return `GOL! ${event.player}`;
        if (isVolleyballFamilySport) return event.player ? `Ponto - ${event.player}` : `Ponto - ${teamName}`;
        if (isHandebol) return `GOL! ${teamName}`;
        return `GOL! ${teamName}`;
      case "yellow_card":
        if (event.description) return event.description;
        if ((isFutsal || isFutebolSociety) && event.player) return `Cartão Amarelo - ${event.player} (${teamName})`;
        return `Cartão Amarelo - ${teamName}`;
      case "red_card":
        if (event.description) return event.description;
        if ((isFutsal || isFutebolSociety) && event.player) return `Cartão Vermelho - ${event.player} (${teamName})`;
        return `Cartão Vermelho - ${teamName}`;
      case "penalty_scored":
        if (event.description) return event.description;
        return `${isHandebol ? "TIRO DE 7 METROS" : "Gol de Pênalti"} - ${teamName}`;
      case "penalty_missed":
        if (event.description) return event.description;
        return `${isHandebol ? "TIRO DE 7 METROS" : "Pênalti"} Perdido - ${teamName}`;
      case "shootout_scored":
        return event.description || `🎯 Shoot-out Marcado - ${teamName}`;
      case "shootout_missed":
        return event.description || `❌ Shoot-out Perdido - ${teamName}`;
      case "set_win":
        if (isBeachTennis) return event.description || `Game para ${teamName}`;
        return event.description || `Set vencido - ${teamName}`;
      case "pause":
        return event.description || `Jogo pausado`;
      case "resume":
        return event.description || `Jogo retomado`;
      case "start":
        return event.description || `Início da partida`;
      case "halftime":
        return event.description || `Intervalo`;
      case "end":
        return event.description || `Fim da partida`;
      case "swimming_result":
        return event.description || `Resultado da prova`;
      default:
        return event.description || teamName || "Evento";
    }
  };

  const getTimelinePrimaryText = (event: MatchEvent & { timelineScore?: string }) => {
    return getEventLabel(event);
  };

  const formatEventClock = (minute: number) => `${minute}'`;

  // O bloco de MVP foi removido conforme solicitação, a Cronologia preencherá o espaço.
  const getEventIcon = (type: MatchEvent["type"]) => {
    const isVolleyball =
      currentMatch.sport === "Vôlei" ||
      currentMatch.sport === "Vôlei de Praia" ||
      currentMatch.sport === "Futevôlei";
    const isBasketball =
      currentMatch.sport === "Basquetebol" ||
      currentMatch.sport === "Basquete 3x3";
    const isSoccerSport = ["Futsal", "Futebol Society", "Futebol X1"].includes(
      currentMatch.sport,
    );

    switch (type) {
      case "goal":
        if (isBasketball) return <div style={{ fontSize: "16px" }}>🏀</div>;
        if (isBeachTennis) return <div style={{ fontSize: "16px" }}>🎾</div>;
        if (isTamboreu) return <div style={{ fontSize: "16px" }}>🎾</div>;
        if (isKarate || isJudo) return <div style={{ fontSize: "16px" }}>🥋</div>;
        if (isSoccerSport) return <div style={{ fontSize: "16px" }}>⚽</div>;
        if (isVolleyball) return <div style={{ fontSize: "16px" }}>🏐</div>;
        return <div style={{ fontSize: "16px" }}>⚽</div>;
      case "swimming_result":
        return <div style={{ fontSize: "16px" }}>🏊</div>;
      case "set_win":
        if (isBeachTennis) return <div style={{ fontSize: "16px" }}>🎾</div>;
        return <Trophy size={16} color="#ffd700" />;
      case "yellow_card":
        return (
          <div
            style={{
              width: 12,
              height: 16,
              background: "#ffcc00",
              borderRadius: 2,
            }}
          />
        );
    }
  };

  const calculateTopMvpCandidates = () => {
    const events = getEventsForMvp();
    if (events.length === 0) return [];

    if (!isMvpVotingSport) return [];

    const playerPoints: {
      [key: string]: {
        playerName: string;
        points: number;
        teamId: string;
        teamName: string;
        institution: string;
        course: string;
      };
    } = {};

    const getTeamMeta = (teamId: string) => {
      // Valida explicitamente — não assume teamB se não for teamA
      const isTeamA = teamId === currentMatch.teamA.id;
      const isTeamB = teamId === currentMatch.teamB.id;
      if (!isTeamA && !isTeamB) return null;
      const matchTeam = isTeamA ? currentMatch.teamA : currentMatch.teamB;
      const nameParts = matchTeam.name.split(" - ");
      const institution = matchTeam.faculty || nameParts[1] || "Não informado";
      return {
        teamName: nameParts[0] || matchTeam.name,
        institution,
        course: matchTeam.course || nameParts[0] || "Não informado",
      };
    };

    const isCountableEvent = (event: MatchEvent): boolean => {
      if (isVolleyMvpSport) {
        // Para vôlei: conta todos os pontos marcados por jogador identificado
        return event.type === "goal" && !!event.player;
      }
      return event.type === "goal" || event.type === "penalty_scored";
    };

    events.forEach((event) => {
      if (isCountableEvent(event) && event.player && event.teamId) {
        const teamMeta = getTeamMeta(event.teamId);
        if (!teamMeta) return; // teamId inválido — ignora

        const key = `${event.teamId}::${event.player.trim().toLowerCase()}`;
        if (!playerPoints[key]) {
          playerPoints[key] = {
            playerName: event.player.trim(),
            points: 0,
            teamId: event.teamId,
            teamName: teamMeta.teamName,
            institution: teamMeta.institution,
            course: teamMeta.course,
          };
        }

        if (isBasketball) {
          const pointValue = Number(event.description?.match(/\+(\d+)/)?.[1] || 1);
          playerPoints[key].points += pointValue;
        } else {
          playerPoints[key].points += 1;
        }
      }
    });

    // Valida contra o placar real: remove candidatos de times que não marcaram,
    // exceto em partidas 0x0 onde todos os candidatos são mantidos (sem gols registrados)
    const scoreA = currentMatch.scoreA;
    const scoreB = currentMatch.scoreB;
    const isScoreless = scoreA === 0 && scoreB === 0;

    const scoreByTeam: Record<string, number> = {
      [currentMatch.teamA.id]: scoreA,
      [currentMatch.teamB.id]: scoreB,
    };

    const filtered = isScoreless
      ? Object.values(playerPoints)
      : Object.values(playerPoints).filter(c => (scoreByTeam[c.teamId] ?? 0) > 0);

    return filtered
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.playerName.localeCompare(b.playerName);
      })
      .slice(0, 3);
  };

  const matchMvpCandidates = useMemo(
    () =>
      mvpCandidates
        .filter((candidate) => candidate.matchId === currentMatch.id)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.votes !== a.votes) return b.votes - a.votes;
          return a.playerName.localeCompare(b.playerName);
        }),
    [mvpCandidates, currentMatch.id],
  );

  const topCandidatesPreview = useMemo(
    () => calculateTopMvpCandidates(),
    [currentMatch.events, currentMatch.id, currentMatch.sport],
  );

  const currentLeader = useMemo(() => {
    if (matchMvpCandidates.length === 0) return null;
    return [...matchMvpCandidates].sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      if (b.points !== a.points) return b.points - a.points;
      return a.playerName.localeCompare(b.playerName);
    })[0];
  }, [matchMvpCandidates]);

  const voterUserId = (user?.id || user?.email || "").toString();
  const voterEmail = user?.email || null;
  const userAlreadyVotedThisMatch = useMemo(() => {
    if (!voterUserId && !voterEmail) return false;
    return hasUserVotedMatch(currentMatch.id, voterUserId, voterEmail);
  }, [currentMatch.id, hasUserVotedMatch, voterEmail, voterUserId]);

  useEffect(() => {
    setMvpCandidatesLoadError(null);
    attemptedMvpSeedMatchIdsRef.current.delete(currentMatch.id);
  }, [currentMatch.id]);

  useEffect(() => {
    if (currentMatch.status !== "finished" || !isMvpVotingSport) return;
    if (matchMvpCandidates.length > 0) return;
    if (attemptedMvpSeedMatchIdsRef.current.has(currentMatch.id)) return;

    const payload: MatchMvpCandidateInput[] = topCandidatesPreview.map((candidate) => ({
      matchId: currentMatch.id,
      sport: currentMatch.sport,
      playerName: candidate.playerName,
      teamId: candidate.teamId,
      teamName: candidate.teamName,
      institution: candidate.institution,
      course: candidate.course,
      points: candidate.points,
    }));

    if (payload.length === 0) return;

    const saveCandidates = async () => {
      attemptedMvpSeedMatchIdsRef.current.add(currentMatch.id);
      setIsSavingMvpCandidates(true);
      setMvpCandidatesLoadError(null);
      const success = await ensureMatchMvpCandidates(payload);
      if (!success) {
        setMvpCandidatesLoadError("Nao foi possivel carregar os candidatos MVP desta partida.");
      }
      setIsSavingMvpCandidates(false);
    };

    saveCandidates();
  }, [
    currentMatch.status,
    currentMatch.id,
    currentMatch.sport,
    isMvpVotingSport,
    matchMvpCandidates.length,
    topCandidatesPreview,
    ensureMatchMvpCandidates,
  ]);

  const handleVoteForCandidate = async (candidateId: string, currentVotes: number) => {
    if (!user) {
      setMvpVoteFeedback("Faca login para votar no MVP.");
      openLoginModal();
      return;
    }

    if (userAlreadyVotedThisMatch) {
      setMvpVoteFeedback("Voce ja votou nesta partida.");
      return;
    }

    setIsVotingCandidateId(candidateId);
    const result = await voteMatchMvpCandidate(
      candidateId,
      currentVotes,
      currentMatch.id,
      voterUserId,
      voterEmail,
    );
    setIsVotingCandidateId(null);

    if (!result.success && result.reason === "already-voted") {
      setMvpVoteFeedback("Voce ja votou nesta partida.");
      setTimeout(() => setMvpVoteFeedback(null), 2500);
      return;
    }

    if (!result.success) {
      setMvpVoteFeedback("Nao foi possivel registrar seu voto agora.");
      setTimeout(() => setMvpVoteFeedback(null), 2500);
      return;
    }

    setMvpVoteFeedback("Voto registrado com sucesso.");
    setTimeout(() => setMvpVoteFeedback(null), 2500);
  };

  const compareEventsAsc = (a: MatchEvent, b: MatchEvent) => {
    const timestampA = getEventTimestamp(a.id);
    const timestampB = getEventTimestamp(b.id);

    if (timestampA !== 0 || timestampB !== 0) {
      const timestampDiff = timestampA - timestampB;
      if (timestampDiff !== 0) return timestampDiff;
    }

    const minuteDiff = a.minute - b.minute;
    if (minuteDiff !== 0) return minuteDiff;
    return getEventTimestamp(a.id) - getEventTimestamp(b.id);
  };

  const getTimelineEventsWithScore = (events: MatchEvent[]) => {
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

    const mappedEvents = [...events].sort(compareEventsAsc).map((event) => {
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
          if (event.teamId === currentMatch.teamA.id) beachPointsA += 1;
          if (event.teamId === currentMatch.teamB.id) beachPointsB += 1;
        }

        if (
          event.type === "set_win" &&
          event.description?.startsWith("Game para ")
        ) {
          if (event.teamId === currentMatch.teamA.id) beachGamesA += 1;
          if (event.teamId === currentMatch.teamB.id) beachGamesB += 1;
          beachPointsA = 0;
          beachPointsB = 0;
        }

        // Tie-break: reseta pontos ao iniciar
        if (event.type === "halftime" && event.description?.startsWith("🎾 Início do Tie-break")) {
          beachPointsA = 0;
          beachPointsB = 0;
        }

        const inTiebreak = events
          .slice(0, events.indexOf(event) + 1)
          .some((e) => e.type === "halftime" && e.description?.startsWith("🎾 Início do Tie-break"));

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
          if (event.teamId === currentMatch.teamA.id) setPointsA += 1;
          if (event.teamId === currentMatch.teamB.id) setPointsB += 1;
        }

        if (event.type === "set_win") {
          if (event.teamId === currentMatch.teamA.id) setScoreA += 1;
          if (event.teamId === currentMatch.teamB.id) setScoreB += 1;
          const finalPtsA = setPointsA;
          const finalPtsB = setPointsB;
          setPointsA = 0;
          setPointsB = 0;
          return {
            ...event,
            timelineScore: `Sets ${setScoreA}x${setScoreB} | Pontos ${finalPtsA}-${finalPtsB}`,
            timelineQuarter,
          };
        }

        return {
          ...event,
          timelineScore: `Sets ${setScoreA}x${setScoreB} | Pontos ${setPointsA}-${setPointsB}`,
          timelineQuarter,
        };
      }

      if (isTamboreu) {
        if (event.type === "goal") {
          if (event.teamId === currentMatch.teamA.id) setPointsA += 1;
          if (event.teamId === currentMatch.teamB.id) setPointsB += 1;
        }

        if (event.type === "set_win") {
          if (event.teamId === currentMatch.teamA.id) setScoreA += 1;
          if (event.teamId === currentMatch.teamB.id) setScoreB += 1;
          setPointsA = 0;
          setPointsB = 0;
        }

        return {
          ...event,
          timelineScore: event.type === "goal" ? `🎾 ${setPointsA} x ${setPointsB}` : "",
          timelineQuarter,
        };
      }

      if (
        event.type === "goal" ||
        event.type === "penalty_scored" ||
        event.type === "shootout_scored" ||
        event.type === "draw" ||
        event.type === "chess_result"
      ) {
        const increment = (isBasketball || isKarate || isJudo || isXadrez)
          ? parseFloat(event.description?.match(/\+([\d.]+)/)?.[1] || "1")
          : 1;

        if (event.teamId === currentMatch.teamA.id) regularScoreA += increment;
        if (event.teamId === currentMatch.teamB.id) regularScoreB += increment;
      }

      const mappedEvent: TimelineEvent = {
        ...event,
        timelineScore: isXadrez
          ? `${regularScoreA.toFixed(1)}x${regularScoreB.toFixed(1)}`
          : `${regularScoreA}x${regularScoreB}`,
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

  // Codigo mantido em comentario conforme solicitado pelo usuario.
  // const simulateMatch = () => {
  //     const isVolleyball = currentMatch.sport === 'Vôlei' || currentMatch.sport.includes('Vôlei');
  //     const scoreA = isVolleyball ? 2 : Math.floor(Math.random() * 5);
  //     const scoreB = isVolleyball ? (Math.random() > 0.5 ? 1 : 0) : Math.floor(Math.random() * 5);
  //
  //     const newEvents: MatchEvent[] = [{id: `start-${Date.now()}`, type: 'start', minute: 0 }];
  //
  //     let currentMin = 5;
  //     for (let i = 0; i < scoreA; i++) {
  //         currentMin += Math.floor(Math.random() * 10) + 1;
  //         newEvents.push({id: `goalA-${i}`, type: isVolleyball ? 'set_win' : 'goal', minute: currentMin, teamId: currentMatch.teamA.id, player: `Jogador ${i + 1} A` });
  //     }
  //     currentMin = 5;
  //     for (let i = 0; i < scoreB; i++) {
  //         currentMin += Math.floor(Math.random() * 10) + 1;
  //         newEvents.push({id: `goalB-${i}`, type: isVolleyball ? 'set_win' : 'goal', minute: currentMin, teamId: currentMatch.teamB.id, player: `Jogador ${i + 1} B` });
  //     }
  //
  //     newEvents.push({id: `end-${Date.now()}`, type: 'end', minute: 90 });
  //
  //     setCurrentMatch(prev => ({
  //         ...prev,
  //         status: 'finished',
  //         scoreA,
  //         scoreB,
  //         events: newEvents
  //     }));
  // };

  return (
    <div
      className="match-modal-overlay"
      onClick={onClose}
    >
      {/* Wrapper para parear as alturas */}
      <div className="match-modal-shell">
        {/* Modal principal */}
        <div
          className="premium-card match-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          <MatchModalHeader
            match={currentMatch}
            isSwimming={isSwimming}
            swimmingParticipants={swimmingParticipants}
            isBeachTennis={isBeachTennis}
            beachLiveState={beachLiveState}
            liveTimerSeconds={liveTimerSeconds}
            timerPaused={timerPaused}
            isTimerCountdown={isTimerCountdown}
            onClose={onClose}
            onOpenPlayerStats={() => setShowPlayerStats(true)}
          />

{/* Botões de ação no topo */ }
<MatchModalActions
  isBasketball={isBasketball}
  onClose={onClose}
  onOpenPlayerStats={() => setShowPlayerStats(true)}
/>
{/* Scrollable Content Body */ }
<div
  className="custom-scrollbar"
  style={{
    flex: 1,
    overflowY: "auto",
    background: "var(--bg-primary)",
  }}
>
  <MatchModalSetBreakdown setBreakdown={setBreakdown} />

  <MatchModalMvpPanel
    isMvpVotingSport={isMvpVotingSport}
    isMvpVotingActive={isMvpVotingActive}
    isSavingMvpCandidates={isSavingMvpCandidates}
    matchMvpCandidates={matchMvpCandidates}
    topCandidatesPreview={topCandidatesPreview}
    currentLeader={currentLeader}
    mvpCandidatesLoadError={mvpCandidatesLoadError}
    mvpVoteFeedback={mvpVoteFeedback}
    mvpVotingSecondsRemaining={mvpVotingSecondsRemaining}
    userAlreadyVotedThisMatch={userAlreadyVotedThisMatch}
    isVotingCandidateId={isVotingCandidateId}
    getMvpPerformanceLabel={getMvpPerformanceLabel}
    onVoteForCandidate={handleVoteForCandidate}
  />

  {/* Timeline Body */}
  <div
    style={{
      padding: "20px",
    }}
  >
    <h3
      style={{
        fontSize: "16px",
        fontWeight: 700,
        marginBottom: "20px",
        color: "var(--text-primary)",
      }}
    >
      Cronologia
    </h3>

    {(() => {
      const matchEvents: MatchEvent[] = currentMatch.events
        ? [...currentMatch.events]
        : [];
      if (
        currentMatch.status === "finished" &&
        !matchEvents.some((e) => e.type === "end")
      ) {
        const maxMin = matchEvents.reduce(
          (max, e) => Math.max(max, e.minute),
          0,
        );
        matchEvents.push({
          id: "end-event",
          type: "end",
          minute: maxMin + 1,
        });
      }

      const timelineEvents = getTimelineEventsWithScore(matchEvents);

      return timelineEvents.length > 0 ? (
        <div style={{ position: "relative" }}>
          {/* Vertical Line */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "10px",
              bottom: "10px",
              width: "2px",
              background: "var(--border-color)",
              transform: "translateX(-50%)",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {timelineEvents.map((event) => {
              const isTeamA = event.teamId === currentMatch.teamA.id;
              const isTeamB = event.teamId === currentMatch.teamB.id;
              const isGeneral = !event.teamId;
              const rowJustify = isGeneral
                ? "center"
                : isTeamA
                  ? "flex-start"
                  : "flex-end";
              const cardWidth = isGeneral ? "56%" : "48%";
              const teamLabel = isTeamA
                ? currentMatch.teamA.name.split(" - ")[0]
                : isTeamB
                  ? currentMatch.teamB.name.split(" - ")[0]
                  : "Jogo";
              return (
                <div
                  key={event.id}
                  style={{
                    display: "flex",
                    justifyContent: rowJustify,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      marginBottom: "6px",
                      width: cardWidth,
                      padding: "8px 10px",
                      borderRadius: "10px",
                      background: "var(--bg-main)",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexDirection: isTeamB ? "row-reverse" : "row",
                      }}
                    >
                      {isBasketball && event.type === "goal" ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(3, minmax(0, 1fr))",
                            width: "100%",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          {(() => {
                            const data = getBasketballEventData(event);
                            return (
                              <>
                                {isTeamA ? (
                                  <>
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        color: "var(--text-primary)",
                                      }}
                                    >
                                      {data.tempo}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 800,
                                        color: "var(--accent-color)",
                                        textAlign: "center",
                                      }}
                                    >
                                      {data.pontuacaoLabel}
                                    </span>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                        gap: "6px",
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        color: "var(--text-primary)",
                                        textAlign: "right",
                                      }}
                                    >
                                      <span>{data.placar}</span>
                                      <span
                                        style={{
                                          width: "3px",
                                          height: "14px",
                                          borderRadius: "999px",
                                          background: "#3b82f6",
                                        }}
                                      />
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        color: "var(--text-primary)",
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: "3px",
                                          height: "14px",
                                          borderRadius: "999px",
                                          background: "#ef4444",
                                        }}
                                      />
                                      <span>{data.placar}</span>
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 800,
                                        color: "var(--accent-color)",
                                        textAlign: "center",
                                      }}
                                    >
                                      {data.pontuacaoLabel}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        color: "var(--text-primary)",
                                        textAlign: "right",
                                      }}
                                    >
                                      {data.tempo}
                                    </span>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              textAlign: isTeamB
                                ? "right"
                                : isGeneral
                                  ? "center"
                                  : "left",
                              flexDirection: isTeamB
                                ? "row-reverse"
                                : "row",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: "20px",
                              }}
                            >
                              {getEventIcon(event.type)}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: "var(--text-primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  justifyContent: isTeamB
                                    ? "flex-end"
                                    : isGeneral
                                      ? "center"
                                      : "flex-start",
                                }}
                              >
                                {getTimelinePrimaryText(event)}
                              </div>
                              {event.timelineScore &&
                                event.type !== "end" &&
                                event.type !== "start" &&
                                !isBasketball && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "var(--accent-color)",
                                      fontWeight: 700,
                                      marginTop: "4px",
                                    }}
                                  >
                                    Placar no momento:{" "}
                                    {event.timelineScore}
                                  </div>
                                )}
                              {event.teamId &&
                                !isBeachTennis &&
                                !isBasketball && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    {teamLabel}
                                    {event.type === "set_win"
                                      ? " venceu o set"
                                      : ""}
                                  </div>
                                )}
                            </div>
                          </div>
                          {!hideTimelineMinute && (
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--accent-color)",
                                marginLeft: isTeamB ? "0" : "12px",
                                marginRight: isTeamB ? "12px" : "0",
                                minWidth: "40px",
                                textAlign: isTeamB ? "left" : "right",
                              }}
                            >
                              {formatEventClock(event.minute)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-secondary)",
          }}
        >
          <Clock
            size={32}
            style={{ opacity: 0.2, marginBottom: "10px" }}
          />
          <div>Nenhum evento registrado ainda.</div>
        </div>
      );
    })()}
  </div>

  {/* Match Stats / History */}
  {
    !isSwimming && (
      <div
        style={{
          padding: "20px",
          borderTop:
            currentMatch.sport !== "Basquete 3x3"
              ? "1px solid var(--border-color)"
              : "none",
          background: "var(--bg-card)",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 700,
            marginBottom: "20px",
            color: "var(--text-primary)",
          }}
        >
          Confrontos diretos
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            {teamAWins > teamBWins && (
              <Trophy
                size={16}
                color="#ffd700"
                style={{ marginBottom: "-4px" }}
              />
            )}
            <div style={{ fontSize: "32px", fontWeight: 900 }}>
              {teamAWins}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              Vitórias
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginTop: "8px",
                textAlign: "center",
              }}
            >
              {currentMatch.teamA.name.split(" - ")[0]}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: 900,
                color: "var(--text-secondary)",
              }}
            >
              {draws}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              Empates
            </div>
            <div
              style={{
                fontSize: "14px",
                marginTop: "8px",
                color: "transparent",
              }}
            >
              -
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            {teamBWins > teamAWins && (
              <Trophy
                size={16}
                color="#ffd700"
                style={{ marginBottom: "-4px" }}
              />
            )}
            <div style={{ fontSize: "32px", fontWeight: 900 }}>
              {teamBWins}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              Vitórias
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginTop: "8px",
                textAlign: "center",
              }}
            >
              {currentMatch.teamB.name.split(" - ")[0]}
            </div>
          </div>
        </div>

        {/* Recent Form */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: "40px",
          }}
        >
          {/* Team A Form */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "15px",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Últimos 5 jogos
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {teamAForm.length > 0 ? (
                teamAForm.map((form: any, i: number) => {
                  let bgColor = "";
                  let letter = "";
                  if (form.result === "win") {
                    bgColor = "#22c55e";
                    letter = "V";
                  } else if (form.result === "loss") {
                    bgColor = "#ef4444";
                    letter = "D";
                  } else {
                    bgColor = "#eab308";
                    letter = "E";
                  }

                  return (
                    <div
                      key={i}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        background: bgColor,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      title={`${form.myScore} - ${form.oppScore} vs ${form.opponent.name}`}
                    >
                      {letter}
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Sem histórico
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              width: "1px",
              background: "var(--border-color)",
              margin: "0 10px",
            }}
          />

          {/* Team B Form */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "15px",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Últimos 5 jogos
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {teamBForm.length > 0 ? (
                teamBForm.map((form: any, i: number) => {
                  let bgColor = "";
                  let letter = "";
                  if (form.result === "win") {
                    bgColor = "#22c55e";
                    letter = "V";
                  } else if (form.result === "loss") {
                    bgColor = "#ef4444";
                    letter = "D";
                  } else {
                    bgColor = "#eab308";
                    letter = "E";
                  }

                  return (
                    <div
                      key={i}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        background: bgColor,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      title={`${form.myScore} - ${form.oppScore} vs ${form.opponent.name}`}
                    >
                      {letter}
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Sem histórico
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
</div >
        </div >

      </div >

  {/* Player Stats Modal */ }
{
  showPlayerStats && (
    <PlayerStats
      match={currentMatch}
      onClose={() => setShowPlayerStats(false)}
    />
  )
}

<style>{`
        @keyframes modalSlideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
      `}</style>
    </div >
  );
};

export default MatchModal;
