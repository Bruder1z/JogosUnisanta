import { useState, useEffect, useRef, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../NotificationContext";
import "./MatchTimeline.css";
import {
  getBeachCurrentGamePoints,
  getBasketballEventData,
  getBasketballQuarterDurationSeconds,
  getBeachScoreState,
  getEventIcon,
  getEventLabel,
  getMatchInitialMinute,
  getMatchTeamShortName,
  getMatchTeamSuffixName,
  formatClock,
  getStoredSwimmingParticipants,
  getSwimmingEntries,
  getTeamEmblem,
  getTeamShortName,
  getTimelineScoreLabel,
  getVolleyballCurrentSetPoints,
  hasSwimmingTime,
  normalizeSwimmingTime,
  parseSwimmingTimeParts,
  sanitizeSwimmingTime,
} from "./MatchTimeline/utils";
import {
  Play,
  Pause,
  StopCircle,
  Clock,
  Plus,
  Filter,
  PlusCircle,
  Trophy,
  ChevronLeft,
  Trash2,
} from "lucide-react";
import { useData } from "../context/DataContext";
import {
  type Match,
  type MatchEvent,
  AVAILABLE_SPORTS,
} from "../../data/mockData";

interface MatchTimelineProps {
  matchId?: string;
}

const MatchTimeline: FC<MatchTimelineProps> = ({ matchId }) => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const {
    matches,
    updateMatch,
    athletes,
    addMatch,
    courses: coursesList,
    deleteMatch,
    deleteScheduledMatches,
  } = useData();

  const [activeMatchId, setActiveMatchId] = useState<string | null>(matchId || null);
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showPlayerInput, setShowPlayerInput] = useState<{
    type: "goal" | "yellow_card" | "red_card" | "penalty_scored" | "penalty_missed";
    team: "A" | "B";
    points?: 1 | 2 | 3;
    isShootout?: boolean;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);
  const [pendingShootout, setPendingShootout] = useState<{
    teamId: string;
    team: "A" | "B";
    playerFouled: string;
    reason: string;
  } | null>(null);

  const [filterSport, setFilterSport] = useState<string>("Todos");
  const [filterLocation, setFilterLocation] = useState<string>("Todos");
  const [filterCategory, setFilterCategory] = useState<string>("Todos");

  const [newMatchForm, setNewMatchForm] = useState({
    teamA: "",
    teamB: "",
    swimmingTeams: Array(8).fill(""),
    sport: "",
    category: "Masculino" as "Masculino" | "Feminino",
    stage: "Fase de Classificação" as "Fase de Classificação" | "Fase Final",
    date: new Date().toISOString().split("T")[0],
    time: "",
    location: "",
  });

  const [emblemA, setEmblemA] = useState<string | null>(null);
  const [emblemB, setEmblemB] = useState<string | null>(null);

  const [swimmingRankings, setSwimmingRankings] = useState<Record<string, number>>({});
  const [athleteNames, setAthleteNames] = useState<Record<string, string>>({});
  const [swimmingTimes, setSwimmingTimes] = useState<Record<string, string>>({});
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

  const [osaekomiTeam, setOsaekomiTeam] = useState<"A" | "B" | null>(null);
  const [osaekomiSeconds, setOsaekomiSeconds] = useState(0);
  const [isGoldenScore, setIsGoldenScore] = useState(false);
  const [chessWinner, setChessWinner] = useState<"A" | "B" | "Draw" | null>(null);
  const [chessReason, setChessReason] = useState<string>("");
  const [tamboreauPointsA, setTamboreauPointsA] = useState<number>(0);
  const [tamboreauPointsB, setTamboreauPointsB] = useState<number>(0);
  const [tamboreauMatchWinner, setTamboreauMatchWinner] = useState<{ name: string; setsA: number; setsB: number } | null>(null);
  const [flashTeam, setFlashTeam] = useState<"A" | "B" | "both" | null>(null);
  const prevScoreRef = useRef<{ a: number; b: number; id: string } | null>(null);
  const [penaltyShootoutActive, setPenaltyShootoutActive] = useState(false);
  const [shootoutFirstTeam, setShootoutFirstTeam] = useState<"A" | "B">("A");
  const [_volleyActionFeedback, setVolleyActionFeedback] = useState<{ playerId: string; type: "ace" | "erro" } | null>(null);
  const [beachPointPicker, setBeachPointPicker] = useState<{ team: "A" | "B" } | null>(null);

  const selectedMatch = matches.find((match) => match.id === activeMatchId) || null;

  const seedMvpCandidatesOnFinish = async (_finishedMatch: Match) => {
    return;
  };

  const finishMatch = (updatedMatch: Match) => {
    if (updatedMatch.status === "finished") {
      void seedMvpCandidatesOnFinish(updatedMatch);
    }
    updateMatch(updatedMatch);
    setIsRunning(false);
  };

  const activeMatches = matches.filter((match) => match.status !== "finished");
  const dynamicSports = Array.from(new Set(activeMatches.map((match) => match.sport).filter(Boolean))).sort();
  const sportsOptions = dynamicSports.length > 0 ? dynamicSports : AVAILABLE_SPORTS;
  const dynamicLocations = Array.from(new Set(activeMatches.map((match) => match.location).filter(Boolean))).sort();
  const locationOptions = dynamicLocations.length > 0 ? dynamicLocations : ["Arena Rebouças", "Arena Unisanta", "Bloco A - Quadra"];
  const dynamicCategories = Array.from(new Set(activeMatches.map((match) => match.category).filter(Boolean))).sort();
  const categoryOptions = dynamicCategories.length > 0 ? dynamicCategories : ["Masculino", "Feminino"];

  const filteredMatches = matches
    .filter((match) => {
      const matchesStatus = match.status !== "finished";
      const normalize = (value?: string) => (value || "").trim().toLowerCase();
      const matchesSport = filterSport === "Todos" || normalize(match.sport) === normalize(filterSport);
      const matchesLocation = filterLocation === "Todos" || normalize(match.location) === normalize(filterLocation);
      const matchesCategory = filterCategory === "Todos" || normalize(match.category) === normalize(filterCategory);
      return matchesStatus && matchesSport && matchesLocation && matchesCategory;
    })
    .sort((left, right) => {
      if (left.status === "live" && right.status !== "live") return -1;
      if (right.status === "live" && left.status !== "live") return 1;
      return 0;
    });

  const isBeachTennis = selectedMatch?.sport === "Beach Tennis";
  const isHandebol = selectedMatch?.sport === "Handebol";
  const isVolleyball =
    selectedMatch?.sport === "Vôlei" ||
    selectedMatch?.sport === "Vôlei de Praia" ||
    selectedMatch?.sport === "Futevôlei";
  const isVolleyballAceSport = selectedMatch?.sport === "Vôlei" || selectedMatch?.sport === "Vôlei de Praia" || selectedMatch?.sport === "Futevôlei";
  const isFutsal = selectedMatch?.sport === "Futsal";
  const isFutebolSociety = selectedMatch?.sport === "Futebol Society";
  const isFutebolX1 = selectedMatch?.sport === "Futebol X1";
  const isBasketball = selectedMatch?.sport === "Basquetebol" || selectedMatch?.sport === "Basquete 3x3";
  const isBasketball3x3 = selectedMatch?.sport === "Basquete 3x3";
  const isKarate = selectedMatch?.sport === "Caratê";
  const isJudo = selectedMatch?.sport === "Judô";
  const isXadrez = selectedMatch?.sport === "Xadrez";
  const isNoTimerSport = ["Vôlei", "Vôlei de Praia", "Tênis de Mesa", "Futevôlei", "Beach Tennis", "Natação", "Xadrez", "Tamboréu"].includes(selectedMatch?.sport || "");
  const isSwimming = selectedMatch?.sport === "Natação";
  const isTamboreu = selectedMatch?.sport === "Tamboréu";
  const isSetSport = isVolleyball || selectedMatch?.sport === "Tênis de Mesa";
  const isPenaltyShootoutSport = selectedMatch?.sport === "Futebol X1" || selectedMatch?.sport === "Futebol Society";
  const shootoutStarted = (selectedMatch?.events || []).some(
    (event) => event.type === "halftime" && event.description?.startsWith("🏈 Início da Disputa de Pênaltis"),
  );

  const BEACH_POINT_LABELS = ["0", "15", "30", "40"];

  const OFFICIAL_LOCATIONS = [
    "Arena Rebouças",
    "Arena Unisanta (Praça das Bandeiras)",
    "Ginásio Poliesportivo",
    "Piscina Olímpica",
    "Quadra Externa",
    "Sala de Xadrez",
    "Tenda Principal",
  ];

  const FIXED_LOCATIONS: Record<string, string> = {
    Natação: "Piscina Olímpica",
    "Basquete 3x3": "Ginásio Poliesportivo",
    Xadrez: "Sala de Xadrez",
  };

  const FILTERED_LOCATIONS: Record<string, string[]> = {
    Basquetebol: ["Ginásio Poliesportivo", "Arena Rebouças"],
    "Basquete 3x3": ["Ginásio Poliesportivo"],
    Futebol: ["Arena Rebouças", "Arena Unisanta (Praça das Bandeiras)"],
    "Futebol Society": ["Arena Rebouças", "Quadra Externa"],
    Futsal: ["Ginásio Poliesportivo", "Quadra Externa"],
    "Futebol X1": ["Arena Rebouças", "Quadra Externa"],
    Handebol: ["Ginásio Poliesportivo", "Arena Rebouças"],
    Vôlei: ["Ginásio Poliesportivo", "Quadra Externa"],
    "Vôlei de Praia": ["Quadra Externa"],
    Futevôlei: ["Quadra Externa"],
    "Tênis de Mesa": ["Ginásio Poliesportivo", "Sala de Xadrez"],
    Tamboréu: ["Arena Rebouças", "Quadra Externa"],
  };

  const normalizeSport = (value?: string) => (value || "").trim().toLowerCase();
  const normalizeSex = (value?: string) => (value || "").trim().toLowerCase();

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

  const athleteHasSport = (
    athlete: (typeof athletes)[number],
    sport: string,
  ) => {
    const targetSport = normalizeSport(sport);
    return toSportList((athlete as { sports?: unknown }).sports).some(
      (athleteSport) => normalizeSport(athleteSport) === targetSport,
    );
  };

  const athleteMatchesTeamAndMatch = (
    athlete: (typeof athletes)[number],
    team: Match["teamA"],
    match: Match | null = selectedMatch,
  ) => {
    if (!match) return false;

    const athleteCourse = athlete.course.toLowerCase();
    const athleteInst = athlete.institution.toLowerCase();
    const teamCourse = (team.course || "").toLowerCase();
    const teamFaculty = (team.faculty || "").toLowerCase();

    const isFefespMatch =
      (teamCourse.includes("fefesp") ||
        teamCourse.includes("educação física")) &&
      (athleteCourse.includes("fefesp") ||
        athleteCourse.includes("educação física") ||
        athleteInst.includes("fefesp"));

    const courseMatch =
      athleteCourse.includes(teamCourse) || teamCourse.includes(athleteCourse);
    const facultyMatch =
      athleteInst.includes(teamFaculty) || teamFaculty.includes(athleteInst);

    const sameTeam = isFefespMatch || (courseMatch && facultyMatch);
    const sameSport = athleteHasSport(athlete, match.sport);
    const athleteSex = (athlete as { sex?: string }).sex;
    const sameSex =
      !athleteSex ||
      normalizeSex(athleteSex) === normalizeSex(match.category);

    return sameTeam && sameSport && sameSex;
  };

  const shootoutStats = (() => {
    if (!selectedMatch) {
      return {
        scoredA: 0,
        scoredB: 0,
        totalA: 0,
        totalB: 0,
        usedPlayersA: [] as string[],
        usedPlayersB: [] as string[],
        nextTeam: "A" as "A" | "B",
        isSuddenDeath: false,
      };
    }

    const startIdx = (selectedMatch.events || []).findIndex(
      (event) => event.type === "halftime" && event.description?.startsWith("🏈 Início da Disputa de Pênaltis"),
    );

    if (startIdx === -1) {
      return {
        scoredA: 0,
        scoredB: 0,
        totalA: 0,
        totalB: 0,
        usedPlayersA: [] as string[],
        usedPlayersB: [] as string[],
        nextTeam: "A" as "A" | "B",
        isSuddenDeath: false,
      };
    }

    const startDesc = (selectedMatch.events || [])[startIdx]?.description || "";
    const firstTeamMatch = startDesc.match(/first=([AB])/);
    const firstTeam: "A" | "B" = (firstTeamMatch?.[1] as "A" | "B") || "A";
    const shootoutEvents = (selectedMatch.events || []).slice(startIdx + 1).filter(
      (event) => event.type === "penalty_scored" || event.type === "penalty_missed",
    );
    const scoredA = shootoutEvents.filter(
      (event) => event.type === "penalty_scored" && event.teamId === selectedMatch.teamA.id,
    ).length;
    const scoredB = shootoutEvents.filter(
      (event) => event.type === "penalty_scored" && event.teamId === selectedMatch.teamB.id,
    ).length;
    const totalA = shootoutEvents.filter((event) => event.teamId === selectedMatch.teamA.id).length;
    const totalB = shootoutEvents.filter((event) => event.teamId === selectedMatch.teamB.id).length;
    const usedPlayersA = shootoutEvents
      .filter((event) => event.teamId === selectedMatch.teamA.id && event.player)
      .map((event) => event.player as string);
    const usedPlayersB = shootoutEvents
      .filter((event) => event.teamId === selectedMatch.teamB.id && event.player)
      .map((event) => event.player as string);
    const totalKicks = totalA + totalB;
    const nextTeam: "A" | "B" = totalKicks % 2 === 0 ? firstTeam : firstTeam === "A" ? "B" : "A";
    const isSuddenDeath = totalA >= 3 && totalB >= 3;

    return { scoredA, scoredB, totalA, totalB, usedPlayersA, usedPlayersB, nextTeam, isSuddenDeath };
  })();

  const getSelectedMatchTeamShortName = (side: "A" | "B") => {
    if (!selectedMatch) return "";
    return side === "A" ? getTeamShortName(selectedMatch.teamA) : getTeamShortName(selectedMatch.teamB);
  };

  const selectedMatchTeamAShortName = getTeamShortName(selectedMatch?.teamA);
  const selectedMatchTeamBShortName = getTeamShortName(selectedMatch?.teamB);

  const getSelectedMatchTeamId = (side: "A" | "B") => {
    if (!selectedMatch) return "";
    return side === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
  };

  const getCurrentEventMinute = () => currentMinute;

  const beachScoreState = getBeachScoreState(selectedMatch);
  const beachSetsState = (selectedMatch?.events || []).reduce(
    (acc, event) => {
      if (event.type !== "set_win") return acc;
      if (!event.description?.startsWith("Set para ")) return acc;
      if (event.teamId === selectedMatch?.teamA.id) acc.setsA += 1;
      if (event.teamId === selectedMatch?.teamB.id) acc.setsB += 1;
      return acc;
    },
    { setsA: 0, setsB: 0 },
  );

  // Flash do placar: branco por padrão, vermelho por 4s ao marcar
  useEffect(() => {
    if (!selectedMatch) {
      prevScoreRef.current = null;
      return;
    }

    const prev = prevScoreRef.current;
    const curr = { a: selectedMatch.scoreA, b: selectedMatch.scoreB, id: selectedMatch.id };

    if (prev !== null && prev.id === curr.id) {
      if (curr.a > prev.a && curr.b > prev.b) {
        setFlashTeam("both");
        setTimeout(() => setFlashTeam(null), 4000);
      } else if (curr.a > prev.a) {
        setFlashTeam("A");
        setTimeout(() => setFlashTeam(null), 4000);
      } else if (curr.b > prev.b) {
        setFlashTeam("B");
        setTimeout(() => setFlashTeam(null), 4000);
      }
    }

    prevScoreRef.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatch?.scoreA, selectedMatch?.scoreB, selectedMatch?.id]);

  useEffect(() => {
    if (!isSwimming || !isRankingModalOpen || !selectedMatch) return;

    const participants = getStoredSwimmingParticipants(selectedMatch);
    const allIds = participants.map((participant) => participant.id);

    const idsWithTime = allIds.filter((id) => hasSwimmingTime(swimmingTimes[id] || ""));
    const idsWithoutTime = new Set(allIds.filter((id) => !hasSwimmingTime(swimmingTimes[id] || "")));

    const sorted = [...idsWithTime].sort((idA, idB) => {
      const tA = normalizeSwimmingTime(swimmingTimes[idA] || "") || "99:99.99";
      const tB = normalizeSwimmingTime(swimmingTimes[idB] || "") || "99:99.99";
      return tA.localeCompare(tB);
    });

    setSwimmingRankings((previous) => {
      const next = { ...previous };
      idsWithoutTime.forEach((id) => {
        delete next[id];
      });
      sorted.forEach((id, index) => {
        next[id] = index + 1;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swimmingTimes, isSwimming, isRankingModalOpen]);

  const handleSelectMatch = (match: Match) => {
    setActiveMatchId(match.id);
    if (
      ["Vôlei", "Vôlei de Praia", "Tênis de Mesa", "Futevôlei", "Tamboréu"].includes(
        match.sport,
      )
    ) {
      setCurrentMinute(0);
      setIsRunning(false);
      // Restaurar pontos do set atual a partir dos eventos persistidos
      if (match.sport === "Tamboréu") {
        const events = match.events || [];
        const lastSetWin = [...events].reverse().find((e) => e.type === "set_win");
        const relevantGoals = lastSetWin
          ? events.slice(events.indexOf(lastSetWin) + 1)
          : events;
        const ptsA = relevantGoals.filter(
          (e) => e.type === "goal" && e.teamId === match.teamA.id
        ).length;
        const ptsB = relevantGoals.filter(
          (e) => e.type === "goal" && e.teamId === match.teamB.id
        ).length;
        setTamboreauPointsA(ptsA);
        setTamboreauPointsB(ptsB);
      }
      return;
    }

    setCurrentMinute(getMatchInitialMinute(match));
    setIsRunning(match.status === "live");
  };

  // Guard: blocks any event unless the match has been formally started.
  const requireGameStarted = () => {
    if (!selectedMatch) return false;
    const hasStarted = selectedMatch.events?.some((e) => e.type === "start");
    if (!hasStarted) {
      showNotification("⚠️ Aperte em 'Iniciar Jogo' para começar a partida!");
      return false;
    }
    return true;
  };

  const addEvent = async (
    type: MatchEvent["type"],
    teamId?: string,
    player?: string,
  ) => {
    if (!selectedMatch) return;
    if (type !== "start" && type !== "end" && type !== "halftime" && !requireGameStarted()) return;

    const existingEvents = selectedMatch.events || [];

    // Lógica de Cartão Amarelo
    if (type === "yellow_card" && player) {
      const currentYellowCards = existingEvents.filter(
        (e) => e.player === player && e.type === "yellow_card",
      ).length;

      if (currentYellowCards >= 1) {
        const eventBaseTs = Date.now();
        const yellowEvent: MatchEvent = {
          id: `evt_${eventBaseTs}_yellow`,
          type: "yellow_card",
          minute: getCurrentEventMinute(),
          teamId,
          player,
        };

        // Futebol X1: 2º amarelo ativa shoot-out obrigatório para o adversário
        if (isFutebolX1) {
          const opponentTeamId =
            teamId === selectedMatch.teamA.id
              ? selectedMatch.teamB.id
              : selectedMatch.teamA.id;
          const opponentTeam: "A" | "B" =
            opponentTeamId === selectedMatch.teamA.id ? "A" : "B";
          const opponentTeamName =
            opponentTeam === "A"
              ? getTeamShortName(selectedMatch.teamA)
              : getTeamShortName(selectedMatch.teamB);

          // Registra o 2º amarelo e reseta o contador do jogador
          const eventsWithoutPlayerYellows = existingEvents.filter(
            (e) => !(e.player === player && e.type === "yellow_card"),
          );
          await updateMatch({
            ...selectedMatch,
            events: [...eventsWithoutPlayerYellows, yellowEvent],
          });

          // Ativa o shoot-out obrigatório
          setPendingShootout({
            teamId: opponentTeamId,
            team: opponentTeam,
            playerFouled: player,
            reason: `🟨 2º Amarelo de ${player} — ${opponentTeamName} deve cobrar o Shoot-out`,
          });
          return;
        }

        // Outros esportes: 2º amarelo = cartão vermelho automático
        const redEvent: MatchEvent = {
          id: `evt_${eventBaseTs + 1}_red`,
          type: "red_card",
          minute: getCurrentEventMinute(),
          teamId,
          player,
          description: "Cartão Vermelho (2º Amarelo)",
        };

        const updatedEventsWithRed = [...existingEvents, yellowEvent, redEvent];

        await updateMatch({
          ...selectedMatch,
          events: updatedEventsWithRed,
        });
        return;
      }
    }

    let customDescription = undefined;
    if (selectedMatch.sport === "Futebol Society") {
      const teamName =
        teamId === selectedMatch.teamA.id
          ? selectedMatchTeamAShortName
          : selectedMatchTeamBShortName;
      if (type === "goal")
        customDescription = player
          ? `⚽ GOL! ${player}`
          : `⚽ GOL para ${teamName}`;
      if (type === "yellow_card")
        customDescription = player
          ? `Cartão Amarelo - ${player}`
          : `Cartão para ${teamName}`;
      if (type === "red_card")
        customDescription = player
          ? `Cartão Vermelho - ${player}`
          : `Cartão para ${teamName}`;
      if (type === "penalty_scored")
        customDescription = player
          ? `Pênalti convertido! ${player}`
          : "Pênalti convertido!";
    }

    if (selectedMatch.sport === "Futsal") {
      const teamName =
        teamId === selectedMatch.teamA.id
          ? selectedMatchTeamAShortName
          : selectedMatchTeamBShortName;
      if (type === "goal")
        customDescription = player
          ? `⚽ GOL! ${player}`
          : `⚽ GOL para ${teamName}`;
      if (type === "yellow_card")
        customDescription = player
          ? `Cartão Amarelo - ${player}`
          : `Cartão Amarelo - ${teamName}`;
      if (type === "red_card")
        customDescription = player
          ? `Cartão Vermelho - ${player}`
          : `Cartão Vermelho - ${teamName}`;
      if (type === "penalty_scored")
        customDescription = player
          ? `Pênalti convertido! ${player}`
          : `Pênalti convertido!`;
    }

    const newEvent: MatchEvent = {
      id: `evt_${Date.now()}`,
      type,
      minute: getCurrentEventMinute(),
      teamId,
      player,
      description: customDescription,
    };

    const updatedEvents = [...existingEvents, newEvent];

    // Atualizar pontuação se for gol ou pênalti marcado
    let newScoreA = selectedMatch.scoreA;
    let newScoreB = selectedMatch.scoreB;
    let newStatus = type === "end" ? "finished" : "live";

    if (
      type === "goal" ||
      type === "penalty_scored" ||
      type === "shootout_scored"
    ) {
      if (teamId === selectedMatch.teamA.id) {
        newScoreA += 1;
      } else if (teamId === selectedMatch.teamB.id) {
        newScoreB += 1;
      }
    }

    // Regra de Cartão Vermelho no X1 = Fim de Jogo
    if (type === "red_card" && isFutebolX1) {
      newStatus = "finished";
      const opponentTeam =
        teamId === selectedMatch.teamA.id
          ? selectedMatch.teamB.name
          : selectedMatch.teamA.name;
      const endEvent: MatchEvent = {
        id: `evt_${Date.now()}_end`,
        type: "end",
        minute: getCurrentEventMinute(),
        description: `🟥 Fim de jogo! Atleta expulso. Vitória automática para ${opponentTeam}`,
      };
      updatedEvents.push(endEvent);
    }

    const updatedMatch: Match = {
      ...selectedMatch,
      events: updatedEvents,
      scoreA: newScoreA,
      scoreB: newScoreB,
      status: newStatus as Match["status"],
    };

    await updateMatch(updatedMatch);
    if (newStatus === "finished") setIsRunning(false);
  };

  const pushMatchEvent = (newEvent: Omit<MatchEvent, "id">) => {
    if (!selectedMatch) return;
    const updatedEvents = [
      ...(selectedMatch.events || []),
      { ...newEvent, id: `evt_${Date.now()}` },
    ];
    const updatedMatch: Match = {
      ...selectedMatch,
      events: updatedEvents,
    };
    updateMatch(updatedMatch);
    return updatedMatch;
  };

  const handleBeachPoint = (team: "A" | "B") => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;

    const isFinal = selectedMatch.stage === "Fase Final";
    const targetGames = isFinal ? 8 : 6;
    const teamId = getSelectedMatchTeamId(team);
    const teamShort = getMatchTeamShortName(selectedMatch, team);

    const { ptsA, ptsB, isTiebreak } = getBeachCurrentGamePoints(selectedMatch);
    const newPtsA = team === "A" ? ptsA + 1 : ptsA;
    const newPtsB = team === "B" ? ptsB + 1 : ptsB;

    const pointEvent: MatchEvent = {
      id: `evt_${Date.now()}_goal`,
      type: "goal",
      minute: getCurrentEventMinute(),
      teamId,
      description: `Ponto para ${teamShort}`,
    };

    let newGamesA = selectedMatch.scoreA;
    let newGamesB = selectedMatch.scoreB;
    const extraEvents: MatchEvent[] = [];

    if (isTiebreak) {
      // Tie-break: primeiro a 7 com 2 de diferença
      const winTiebreak = (newPtsA >= 7 || newPtsB >= 7) && Math.abs(newPtsA - newPtsB) >= 2;
      if (winTiebreak) {
        const winner = newPtsA > newPtsB ? "A" : "B";
        const winnerTeamId = getSelectedMatchTeamId(winner);
        const winnerName = getSelectedMatchTeamShortName(winner);
        newGamesA = winner === "A" ? newGamesA + 1 : newGamesA;
        newGamesB = winner === "B" ? newGamesB + 1 : newGamesB;
        extraEvents.push({
          id: `evt_${Date.now() + 1}_gamewin`,
          type: "set_win",
          minute: getCurrentEventMinute(),
          teamId: winnerTeamId,
          description: `Game para ${winnerName} (Tie-break ${newPtsA}x${newPtsB})`,
        });
        extraEvents.push({
          id: `evt_${Date.now() + 2}_end`,
          type: "end",
          minute: getCurrentEventMinute(),
          description: `Fim de Partida: ${winnerName} venceu por ${newGamesA}x${newGamesB} de Games`,
        });
        finishMatch({
          ...selectedMatch,
          scoreA: newGamesA,
          scoreB: newGamesB,
          status: "finished",
          events: [...(selectedMatch.events || []), pointEvent, ...extraEvents],
        });
        return;
      }
    } else {
      // Game normal No-Ad: 4 pontos = Game
      const winGame = newPtsA >= 4 || newPtsB >= 4;
      if (winGame) {
        const winner = newPtsA >= 4 ? "A" : "B";
        const winnerTeamId = getSelectedMatchTeamId(winner);
        const winnerName = getSelectedMatchTeamShortName(winner);
        newGamesA = winner === "A" ? newGamesA + 1 : newGamesA;
        newGamesB = winner === "B" ? newGamesB + 1 : newGamesB;
        extraEvents.push({
          id: `evt_${Date.now() + 1}_gamewin`,
          type: "set_win",
          minute: getCurrentEventMinute(),
          teamId: winnerTeamId,
          description: `Game para ${winnerName}: ${newGamesA}x${newGamesB}`,
        });

        const tiebreakNeeded = newGamesA === targetGames && newGamesB === targetGames;
        const setWon = !tiebreakNeeded &&
          ((newGamesA >= targetGames && newGamesA - newGamesB >= 2) ||
            (newGamesB >= targetGames && newGamesB - newGamesA >= 2));

        if (tiebreakNeeded) {
          extraEvents.push({
            id: `evt_${Date.now() + 2}_tb`,
            type: "halftime",
            minute: getCurrentEventMinute(),
            description: `🎾 Início do Tie-break decisivo (${newGamesA}x${newGamesB})`,
          });
        } else if (setWon) {
          const setWinnerName = newGamesA > newGamesB
            ? selectedMatchTeamAShortName
            : selectedMatchTeamBShortName;
          extraEvents.push({
            id: `evt_${Date.now() + 3}_end`,
            type: "end",
            minute: getCurrentEventMinute(),
            description: `Fim de Partida: ${setWinnerName} venceu por ${newGamesA}x${newGamesB} de Games`,
          });
          finishMatch({
            ...selectedMatch,
            scoreA: newGamesA,
            scoreB: newGamesB,
            status: "finished",
            events: [...(selectedMatch.events || []), pointEvent, ...extraEvents],
          });
          return;
        }

        updateMatch({
          ...selectedMatch,
          scoreA: newGamesA,
          scoreB: newGamesB,
          status: "live",
          events: [...(selectedMatch.events || []), pointEvent, ...extraEvents],
        });
        return;
      }
    }

    // Apenas registra o ponto
    updateMatch({
      ...selectedMatch,
      events: [...(selectedMatch.events || []), pointEvent],
      status: "live",
    });
  };



  const handleSetWin = (team: "A" | "B") => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;

    const teamId =
      getSelectedMatchTeamId(team);
    const teamName = getSelectedMatchTeamShortName(team);

    // Derive current set points from events for the description
    const lastSetWinEvent = [...(selectedMatch.events || [])]
      .reverse()
      .find((e) => e.type === "set_win");
    const relevantEvents = lastSetWinEvent
      ? selectedMatch.events?.slice(
        selectedMatch.events.indexOf(lastSetWinEvent) + 1,
      ) || []
      : selectedMatch.events || [];

    const ptsA = relevantEvents.filter(
      (e) => e.type === "goal" && e.teamId === selectedMatch.teamA.id,
    ).length;
    const ptsB = relevantEvents.filter(
      (e) => e.type === "goal" && e.teamId === selectedMatch.teamB.id,
    ).length;

    // Preserve the current set points exactly as recorded by goal events.
    const finalPtsA = ptsA;
    const finalPtsB = ptsB;

    const setWinEvent: MatchEvent = {
      id: `evt_${Date.now()}`,
      type: "set_win",
      minute: getCurrentEventMinute(),
      teamId,
      description: `Set ganho por ${teamName} (${finalPtsA} x ${finalPtsB})`,
      score: `${team === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA}x${team === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB}`,
    };

    const updatedMatch: Match = {
      ...selectedMatch,
      scoreA: team === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA,
      scoreB: team === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB,
      events: [...(selectedMatch.events || []), setWinEvent],
      status: "live",
    };

    updateMatch(updatedMatch);
  };

  // ACE: ponto para o time que serviu, registrado com nome do atleta
  const _handleVolleyAce = (team: "A" | "B", playerName: string, playerId: string) => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;
    const scoringTeamId = getSelectedMatchTeamId(team);
    const teamName = team === "A" ? getTeamShortName(selectedMatch.teamA) : getTeamShortName(selectedMatch.teamB);
    // Recalcular pontuação do set atual antes de adicionar o ponto (igual a handleVolleyPoint)
    const { ptsA, ptsB } = getVolleyballCurrentSetPoints(selectedMatch);
    const nextPtsA = team === "A" ? ptsA + 1 : ptsA;
    const nextPtsB = team === "B" ? ptsB + 1 : ptsB;
    const aceEvent: MatchEvent = {
      id: `evt_${Date.now()}_ace`,
      type: "goal",
      minute: getCurrentEventMinute(),
      teamId: scoringTeamId,
      player: playerName,
      description: `🏐 ACE! ${playerName} (${teamName}) — ${nextPtsA}x${nextPtsB}`,
      score: `${selectedMatch.scoreA}x${selectedMatch.scoreB} (${nextPtsA}-${nextPtsB})`,
    } as MatchEvent;
    // Reusar lógica de pontuação do set via handleVolleyPoint internamente
    const updatedMatch: Match = {
      ...selectedMatch,
      status: "live",
      events: [...(selectedMatch.events || []), aceEvent],
    };
    // Disparar feedback visual
    setVolleyActionFeedback({ playerId, type: "ace" });
    setTimeout(() => setVolleyActionFeedback(null), 600);
    // Delegar lógica de set/fim de jogo à handleVolleyPoint interna
    handleVolleyPointInternal(team, updatedMatch, nextPtsA, nextPtsB);
  };

  // ERRO: ponto para o time adversário (erro de saque dá ponto para quem recebe)
  const _handleVolleyErro = (team: "A" | "B", playerName: string, playerId: string) => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;
    const adversaryTeam: "A" | "B" = team === "A" ? "B" : "A";
    const adversaryTeamId = getSelectedMatchTeamId(adversaryTeam);
    const adversaryName = getMatchTeamShortName(selectedMatch, adversaryTeam);
    const { ptsA, ptsB } = getVolleyballCurrentSetPoints(selectedMatch);
    const nextPtsA = adversaryTeam === "A" ? ptsA + 1 : ptsA;
    const nextPtsB = adversaryTeam === "B" ? ptsB + 1 : ptsB;
    const erroEvent: MatchEvent = {
      id: `evt_${Date.now()}_erro`,
      type: "goal",
      minute: getCurrentEventMinute(),
      teamId: adversaryTeamId,
      player: playerName,
      description: `❌ Erro de Saque — ${playerName} | Ponto para ${adversaryName} (${nextPtsA}x${nextPtsB})`,
      score: `${selectedMatch.scoreA}x${selectedMatch.scoreB} (${nextPtsA}-${nextPtsB})`,
    } as MatchEvent;
    const updatedMatch: Match = {
      ...selectedMatch,
      status: "live",
      events: [...(selectedMatch.events || []), erroEvent],
    };
    setVolleyActionFeedback({ playerId, type: "erro" });
    setTimeout(() => setVolleyActionFeedback(null), 600);
    handleVolleyPointInternal(adversaryTeam, updatedMatch, nextPtsA, nextPtsB);
  };

  // Função interna que aplica a lógica de set/fim de jogo a partir de um match já mutado
  const handleVolleyPointInternal = (scoringTeam: "A" | "B", updatedMatch: Match, nextPtsA: number, nextPtsB: number) => {
    if (!selectedMatch) return;
    const scoringTeamId = getSelectedMatchTeamId(scoringTeam);
    const currentPhase = selectedMatch.stage || "Fase de Classificação";

    if (selectedMatch.sport === "Vôlei" && currentPhase === "Fase de Classificação") {
      if (nextPtsA >= 25 || nextPtsB >= 25) {
        const winner = nextPtsA >= 25 ? "A" : "B";
        const winnerName = getMatchTeamShortName(selectedMatch, winner);
        updatedMatch.status = "finished";
        updatedMatch.scoreA = winner === "A" ? 1 : 0;
        updatedMatch.scoreB = winner === "B" ? 1 : 0;
        updatedMatch.events = [
          ...(updatedMatch.events || []),
          { id: `evt_${Date.now() + 1}`, type: "set_win", minute: getCurrentEventMinute(), teamId: scoringTeamId, description: `Fim de Jogo (Fase de Classificação) para ${winnerName}`, score: winner === "A" ? "1x0" : "0x1" } as MatchEvent,
          { id: `evt_${Date.now() + 2}`, type: "end", minute: getCurrentEventMinute(), description: `Fim de Jogo - Placar Final: ${nextPtsA} x ${nextPtsB}` } as MatchEvent,
        ];
        finishMatch(updatedMatch);
        return;
      }
    } else if (selectedMatch.sport === "Vôlei" && currentPhase === "Fase Final") {
      const currentSet = selectedMatch.scoreA + selectedMatch.scoreB + 1;
      const targetScore = currentSet <= 2 ? 25 : 15;
      if ((nextPtsA >= targetScore || nextPtsB >= targetScore) && Math.abs(nextPtsA - nextPtsB) >= 2) {
        const winner = nextPtsA > nextPtsB ? "A" : "B";
        const winnerName = getMatchTeamShortName(selectedMatch, winner);
        const newScoreA = winner === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA;
        const newScoreB = winner === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB;
        updatedMatch.scoreA = newScoreA;
        updatedMatch.scoreB = newScoreB;
        updatedMatch.events = [
          ...(updatedMatch.events || []),
          { id: `evt_${Date.now() + 1}`, type: "set_win", minute: getCurrentEventMinute(), teamId: winner === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id, description: `Set ganho por ${winnerName} (${nextPtsA}x${nextPtsB})`, score: `${newScoreA}x${newScoreB}` } as MatchEvent,
        ];
        if (newScoreA === 2 || newScoreB === 2) {
          updatedMatch.status = "finished";
          updatedMatch.events.push({ id: `evt_${Date.now() + 2}`, type: "end", minute: getCurrentEventMinute(), description: `Fim de Jogo - Placar Final: ${newScoreA} x ${newScoreB} em sets` } as MatchEvent);
          finishMatch(updatedMatch);
          return;
        }
        updatedMatch.status = "live";
        updateMatch(updatedMatch);
        setIsRunning(false);
        return;
      }
    } else if (selectedMatch.sport === "Vôlei de Praia") {
      const currentPhaseBeach = selectedMatch.stage || "Fase de Classificação";
      if (currentPhaseBeach === "Fase de Classificação") {
        if (nextPtsA >= 21 || nextPtsB >= 21) {
          const winner = nextPtsA >= 21 ? "A" : "B";
          const winnerName = getMatchTeamShortName(selectedMatch, winner);
          updatedMatch.status = "finished";
          updatedMatch.scoreA = winner === "A" ? 1 : 0;
          updatedMatch.scoreB = winner === "B" ? 1 : 0;
          updatedMatch.events = [
            ...(updatedMatch.events || []),
            { id: `evt_${Date.now() + 1}`, type: "set_win", minute: getCurrentEventMinute(), teamId: scoringTeamId, description: `Fim de Jogo (Fase de Classificação) para ${winnerName}`, score: winner === "A" ? "1x0" : "0x1" } as MatchEvent,
            { id: `evt_${Date.now() + 2}`, type: "end", minute: getCurrentEventMinute(), description: `Fim de Jogo - Placar Final: ${nextPtsA} x ${nextPtsB}` } as MatchEvent,
          ];
          finishMatch(updatedMatch);
          return;
        }
      } else if (currentPhaseBeach === "Fase Final") {
        const currentSet = selectedMatch.scoreA + selectedMatch.scoreB + 1;
        const targetScore = currentSet <= 2 ? 18 : 15;
        if ((nextPtsA >= targetScore || nextPtsB >= targetScore) && Math.abs(nextPtsA - nextPtsB) >= 2) {
          const winner = nextPtsA > nextPtsB ? "A" : "B";
          const winnerName = getMatchTeamShortName(selectedMatch, winner);
          const newScoreA = winner === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA;
          const newScoreB = winner === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB;
          updatedMatch.scoreA = newScoreA;
          updatedMatch.scoreB = newScoreB;
          updatedMatch.events = [
            ...(updatedMatch.events || []),
            { id: `evt_${Date.now() + 1}`, type: "set_win", minute: getCurrentEventMinute(), teamId: winner === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id, description: `Set ganho por ${winnerName} (${nextPtsA}x${nextPtsB})`, score: `${newScoreA}x${newScoreB}` } as MatchEvent,
          ];
          if (newScoreA === 2 || newScoreB === 2) {
            updatedMatch.status = "finished";
            updatedMatch.events.push({ id: `evt_${Date.now() + 2}`, type: "end", minute: getCurrentEventMinute(), description: `Fim de Jogo - Placar Final: ${newScoreA} x ${newScoreB} em sets` } as MatchEvent);
            finishMatch(updatedMatch);
            return;
          }
          updatedMatch.status = "live";
          updateMatch(updatedMatch);
          setIsRunning(false);
          return;
        }
      }
    }
    updateMatch(updatedMatch);
  };

  const handleVolleyPoint = (team: "A" | "B") => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;
    // Para Vôlei de Praia e Vôlei, abrir seletor de jogador antes de registrar
    if (selectedMatch.sport === "Vôlei de Praia" || selectedMatch.sport === "Vôlei") {
      setBeachPointPicker({ team });
      return;
    }
    handleVolleyPointWithPlayer(team, null);
  };

  const handleVolleyPointWithPlayer = (team: "A" | "B", playerName: string | null) => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;

    const scoringTeam = team;

    const scoringTeamId = getSelectedMatchTeamId(scoringTeam);

    const description = (playerName && playerName.trim())
      ? `Ponto para ${scoringTeam === "A" ? selectedMatchTeamAShortName : selectedMatchTeamBShortName} — ${playerName.trim()}`
      : `Ponto para ${scoringTeam === "A" ? selectedMatchTeamAShortName : selectedMatchTeamBShortName}`;

    // Calculate current set points for the snapshot
    const lastSetWinEvent = [...(selectedMatch.events || [])]
      .reverse()
      .find((e) => e.type === "set_win");
    const relevantEvents = lastSetWinEvent
      ? selectedMatch.events?.slice(
        selectedMatch.events.indexOf(lastSetWinEvent) + 1,
      ) || []
      : selectedMatch.events || [];

    const ptsA = relevantEvents.filter(
      (e) => e.type === "goal" && e.teamId === selectedMatch.teamA.id,
    ).length;
    const ptsB = relevantEvents.filter(
      (e) => e.type === "goal" && e.teamId === selectedMatch.teamB.id,
    ).length;

    const nextPtsA = scoringTeam === "A" ? ptsA + 1 : ptsA;
    const nextPtsB = scoringTeam === "B" ? ptsB + 1 : ptsB;

    const updatedMatch: Match = {
      ...selectedMatch,
      status: "live",
      events: [
        ...(selectedMatch.events || []),
        {
          id: `evt_${Date.now()}`,
          type: "goal",
          minute: getCurrentEventMinute(),
          teamId: scoringTeamId,
          player: playerName || undefined,
          description: description,
          score: `${selectedMatch.scoreA}x${selectedMatch.scoreB} (${nextPtsA}-${nextPtsB})`,
        } as MatchEvent,
      ],
    };

    // Lógica para Fase de Classificação no Vôlei
    const currentPhase = selectedMatch.stage || "Fase de Classificação";
    if (selectedMatch.sport === "Vôlei" && currentPhase === "Fase de Classificação") {
      if (nextPtsA >= 25 || nextPtsB >= 25) {
        updatedMatch.status = "finished";
        const winner = nextPtsA >= 25 ? "A" : "B";
        const winnerName = winner === "A" ? selectedMatchTeamAShortName : selectedMatchTeamBShortName;

        updatedMatch.events = [
          ...(updatedMatch.events || []),
          {
            id: `evt_${Date.now() + 1}`,
            type: "set_win",
            minute: getCurrentEventMinute(),
            teamId: scoringTeamId,
            description: `Fim de Jogo (Fase de Classificação) para ${winnerName}`,
            score: winner === "A" ? "1x0" : "0x1",
          } as MatchEvent,
          {
            id: `evt_${Date.now() + 2}`,
            type: "end",
            minute: getCurrentEventMinute(),
            description: `Fim de Jogo - Placar Final: ${nextPtsA} x ${nextPtsB}`,
          } as MatchEvent,
        ];

        updatedMatch.scoreA = winner === "A" ? 1 : 0;
        updatedMatch.scoreB = winner === "B" ? 1 : 0;

        finishMatch(updatedMatch);
        return;
      }
    }

    // Lógica para Fase Final no Vôlei
    if (selectedMatch.sport === "Vôlei" && currentPhase === "Fase Final") {
      const currentSet = selectedMatch.scoreA + selectedMatch.scoreB + 1;
      const targetScore = currentSet <= 2 ? 25 : 15;

      if (
        (nextPtsA >= targetScore || nextPtsB >= targetScore) &&
        Math.abs(nextPtsA - nextPtsB) >= 2
      ) {
        const winner = nextPtsA > nextPtsB ? "A" : "B";
        const winnerName = winner === "A" ? selectedMatchTeamAShortName : selectedMatchTeamBShortName;

        const newScoreA = winner === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA;
        const newScoreB = winner === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB;

        const isMatchOver = newScoreA === 2 || newScoreB === 2;

        updatedMatch.scoreA = newScoreA;
        updatedMatch.scoreB = newScoreB;

        updatedMatch.events = [
          ...(updatedMatch.events || []),
          {
            id: `evt_${Date.now() + 1}`,
            type: "set_win",
            minute: getCurrentEventMinute(),
            teamId: winner === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id,
            description: `Set ganho por ${winnerName} (${nextPtsA}x${nextPtsB})`,
            score: `${newScoreA}x${newScoreB}`,
          } as MatchEvent
        ];

        if (isMatchOver) {
          updatedMatch.status = "finished";
          updatedMatch.events.push({
            id: `evt_${Date.now() + 2}`,
            type: "end",
            minute: getCurrentEventMinute(),
            description: `Fim de Jogo - Placar Final: ${newScoreA} x ${newScoreB} em sets`,
          } as MatchEvent);

          finishMatch(updatedMatch);
          return;
        } else {
          updatedMatch.status = "live";
          updateMatch(updatedMatch);
          setIsRunning(false);
          return;
        }
      }
    }

    // Lógica para Vôlei de Praia
    if (selectedMatch.sport === "Vôlei de Praia") {
      const currentPhaseBeach = selectedMatch.stage || "Fase de Classificação";
      if (currentPhaseBeach === "Fase de Classificação") {
        const targetScore = 21;
        // 1 set de 21 pontos ao chegar (sem obrigação de 2 de diferença)
        if (nextPtsA >= targetScore || nextPtsB >= targetScore) {
          updatedMatch.status = "finished";
          const winner = nextPtsA >= targetScore ? "A" : "B";
          const winnerName = getSelectedMatchTeamShortName(winner);

          updatedMatch.events = [
            ...(updatedMatch.events || []),
            {
              id: `evt_${Date.now() + 1}`,
              type: "set_win",
              minute: getCurrentEventMinute(),
              teamId: scoringTeamId,
              description: `Fim de Jogo (Fase de Classificação) para ${winnerName}`,
              score: winner === "A" ? "1x0" : "0x1",
            } as MatchEvent,
            {
              id: `evt_${Date.now() + 2}`,
              type: "end",
              minute: getCurrentEventMinute(),
              description: `Fim de Jogo - Placar Final: ${nextPtsA} x ${nextPtsB}`,
            } as MatchEvent,
          ];

          updatedMatch.scoreA = winner === "A" ? 1 : 0;
          updatedMatch.scoreB = winner === "B" ? 1 : 0;

          finishMatch(updatedMatch);
          return;
        }
      } else if (currentPhaseBeach === "Fase Final") {
        // Melhor de 3 sets. Primeiros dois = 18. Terceiro = 15.
        const currentSet = selectedMatch.scoreA + selectedMatch.scoreB + 1;
        const targetScore = currentSet <= 2 ? 18 : 15;

        if (
          (nextPtsA >= targetScore || nextPtsB >= targetScore) &&
          Math.abs(nextPtsA - nextPtsB) >= 2
        ) {
          const winner = nextPtsA > nextPtsB ? "A" : "B";
          const winnerName = getSelectedMatchTeamShortName(winner);

          const newScoreA = winner === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA;
          const newScoreB = winner === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB;

          const isMatchOver = newScoreA === 2 || newScoreB === 2;

          updatedMatch.scoreA = newScoreA;
          updatedMatch.scoreB = newScoreB;

          updatedMatch.events = [
            ...(updatedMatch.events || []),
            {
              id: `evt_${Date.now() + 1}`,
              type: "set_win",
              minute: getCurrentEventMinute(),
              teamId: winner === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id,
              description: `Set ganho por ${winnerName} (${nextPtsA}x${nextPtsB})`,
              score: `${newScoreA}x${newScoreB}`,
            } as MatchEvent
          ];

          if (isMatchOver) {
            updatedMatch.status = "finished";
            updatedMatch.events.push({
              id: `evt_${Date.now() + 2}`,
              type: "end",
              minute: getCurrentEventMinute(),
              description: `Fim de Jogo - Placar Final: ${newScoreA} x ${newScoreB} em sets`,
            } as MatchEvent);

            finishMatch(updatedMatch);
            return;
          } else {
            updatedMatch.status = "live";
            updateMatch(updatedMatch);
            setIsRunning(false);
            return;
          }
        }
      }
    }

    // Lógica para Futevôlei
    if (selectedMatch.sport === "Futevôlei") {
      const currentPhaseFoot = selectedMatch.stage || "Fase de Classificação";
      if (currentPhaseFoot === "Fase de Classificação") {
        const targetScore = 18;
        if (
          (nextPtsA >= targetScore || nextPtsB >= targetScore) &&
          Math.abs(nextPtsA - nextPtsB) >= 2
        ) {
          updatedMatch.status = "finished";
          const winner = nextPtsA > nextPtsB ? "A" : "B";
          const winnerName = getSelectedMatchTeamShortName(winner);

          updatedMatch.events = [
            ...(updatedMatch.events || []),
            {
              id: `evt_${Date.now() + 1}`,
              type: "set_win",
              minute: getCurrentEventMinute(),
              teamId: scoringTeamId,
              description: `Fim de Jogo (Fase de Classificação) para ${winnerName}`,
              score: winner === "A" ? "1x0" : "0x1",
            } as MatchEvent,
            {
              id: `evt_${Date.now() + 2}`,
              type: "end",
              minute: getCurrentEventMinute(),
              description: `Fim de Jogo - Placar Final: ${nextPtsA} x ${nextPtsB}`,
            } as MatchEvent,
          ];

          updatedMatch.scoreA = winner === "A" ? 1 : 0;
          updatedMatch.scoreB = winner === "B" ? 1 : 0;

          finishMatch(updatedMatch);
          return;
        }
      } else if (currentPhaseFoot === "Fase Final") {
        // Melhor de 3 sets. Primeiros dois = 18. Terceiro = 15.
        const currentSet = selectedMatch.scoreA + selectedMatch.scoreB + 1;
        const targetScore = currentSet <= 2 ? 18 : 15;

        if (
          (nextPtsA >= targetScore || nextPtsB >= targetScore) &&
          Math.abs(nextPtsA - nextPtsB) >= 2
        ) {
          const winner = nextPtsA > nextPtsB ? "A" : "B";
          const winnerName = getSelectedMatchTeamShortName(winner);

          const newScoreA = winner === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA;
          const newScoreB = winner === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB;

          const isMatchOver = newScoreA === 2 || newScoreB === 2;

          updatedMatch.scoreA = newScoreA;
          updatedMatch.scoreB = newScoreB;

          updatedMatch.events = [
            ...(updatedMatch.events || []),
            {
              id: `evt_${Date.now() + 1}`,
              type: "set_win",
              minute: getCurrentEventMinute(),
              teamId: winner === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id,
              description: `Set ganho por ${winnerName} (${nextPtsA}x${nextPtsB})`,
              score: `${newScoreA}x${newScoreB}`,
            } as MatchEvent
          ];

          if (isMatchOver) {
            updatedMatch.status = "finished";
            updatedMatch.events.push({
              id: `evt_${Date.now() + 2}`,
              type: "end",
              minute: getCurrentEventMinute(),
              description: `Fim de Jogo - Placar Final: ${newScoreA} x ${newScoreB} em sets`,
            } as MatchEvent);

            finishMatch(updatedMatch);
            return;
          } else {
            updatedMatch.status = "live";
            updateMatch(updatedMatch);
            setIsRunning(false);
            return;
          }
        }
      }
    }

    updateMatch(updatedMatch);
  };

  const handleStartMatch = () => {
    if (!selectedMatch) return;

    if (isJudo && currentMinute <= 0 && selectedMatch.scoreA === selectedMatch.scoreB) {
      setIsGoldenScore(true);
      setCurrentMinute(0);
    }

    if ((isBasketball || isKarate || isJudo) && currentMinute <= 0 && !isGoldenScore) {
      const defaultTime = isKarate ? 180 : (isJudo ? 240 : getBasketballQuarterDurationSeconds(selectedMatch));
      setCurrentMinute(defaultTime);
    }

    const hasStarted = selectedMatch.events?.some((e) => e.type === "start");
    if (!hasStarted) {
      addEvent("start");
    } else if (selectedMatch.status !== "live") {
      updateMatch({ ...selectedMatch, status: "live" });
    }
    setIsRunning(!isNoTimerSport);
  };

  const handleHalfTime = () => {
    addEvent("halftime");
    setIsRunning(false);
  };

  // ── Pausa/Retomada com persistência ──────────────────────────────────────
  // Salva evento pause/resume com o minute atual e timestamp no id,
  // permitindo que o MatchModal do usuário sincronize o estado do timer.
  const handlePause = () => {
    if (!selectedMatch) return;
    const pauseEvent: MatchEvent = {
      id: `evt_${Date.now()}_pause`,
      type: "pause",
      minute: getCurrentEventMinute(),
      description: "⏸ Tempo pausado",
    };
    updateMatch({
      ...selectedMatch,
      events: [...(selectedMatch.events || []), pauseEvent],
    });
    setIsRunning(false);
  };

  const handleResume = () => {
    if (!selectedMatch) return;
    const resumeEvent: MatchEvent = {
      id: `evt_${Date.now()}_resume`,
      type: "resume",
      minute: getCurrentEventMinute(),
      description: "▶ Tempo retomado",
    };
    updateMatch({
      ...selectedMatch,
      events: [...(selectedMatch.events || []), resumeEvent],
    });
    setIsRunning(true);
  };

  const handleBasketballQuarterBreak = () => {
    if (!selectedMatch || !isBasketball) return;
    addEvent("halftime");
    setIsRunning(false);
    setCurrentMinute(getBasketballQuarterDurationSeconds(selectedMatch));
  };

  const handleBasketballTimeout = (team: "A" | "B") => {
    if (!selectedMatch || !isBasketball) return;

    const teamName = getSelectedMatchTeamShortName(team);

    const timeoutEvent: MatchEvent = {
      id: `evt_${Date.now()}`,
      type: "halftime",
      minute: getCurrentEventMinute(),
      teamId: team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id,
      description: `Tempo técnico - ${teamName}`,
    };

    updateMatch({
      ...selectedMatch,
      events: [...(selectedMatch.events || []), timeoutEvent],
    });

    setIsRunning(false);
  };

  const handleEndMatch = () => {
    if (!selectedMatch) return;

    // Futsal / Futebol Society empatados → disputa de pênaltis
    if (isPenaltyShootoutSport && selectedMatch.scoreA === selectedMatch.scoreB && !shootoutStarted) {
      setPenaltyShootoutActive(true);
      return;
    }

    const finalScoreLabel = isBeachTennis
      ? `${beachSetsState.setsA} x ${beachSetsState.setsB} (sets)`
      : `${selectedMatch.scoreA} x ${selectedMatch.scoreB}`;

    const finalEvent: MatchEvent = {
      id: `evt_${Date.now()}`,
      type: "end",
      minute: getCurrentEventMinute(),
      description: `Fim de Jogo - Placar Final: ${finalScoreLabel}`,
    };

    const finishedMatch: Match = {
      ...selectedMatch,
      status: "finished",
      events: [...(selectedMatch.events || []), finalEvent],
    };

    finishMatch(finishedMatch);
  };

  const handleBasketballPoint = (team: "A" | "B", points: 1 | 2 | 3) => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;
    if (isBasketball3x3 && (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21)) return;
    // Abre modal de seleção de atleta
    setShowPlayerInput({ type: "goal", team, points });
  };

  const confirmBasketballPoint = (playerName: string) => {
    if (!showPlayerInput || !selectedMatch) return;
    const points = showPlayerInput.points ?? 2;
    const team = showPlayerInput.team;

    const scoringTeamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const nextA = team === "A" ? selectedMatch.scoreA + points : selectedMatch.scoreA;
    const nextB = team === "B" ? selectedMatch.scoreB + points : selectedMatch.scoreB;
    const currentQuarter =
      (selectedMatch.events || []).filter((e) => e.type === "halftime").length + 1;
    const teamShort = getSelectedMatchTeamShortName(team);

    const hasPlayer = playerName && playerName.trim();
    const description = hasPlayer
      ? `[Q${currentQuarter}] [${nextA} x ${nextB}] 🏀 ${playerName.trim()} +${points}pts (${teamShort})`
      : `[Q${currentQuarter}] [${nextA} x ${nextB}] +${points} Ponto${points > 1 ? "s" : ""} para ${teamShort}`;

    const updatedMatch: Match = {
      ...selectedMatch,
      scoreA: nextA,
      scoreB: nextB,
      status: "live",
      events: [
        ...(selectedMatch.events || []),
        {
          id: `evt_${Date.now()}`,
          type: "goal",
          minute: getCurrentEventMinute(),
          teamId: scoringTeamId,
          player: hasPlayer ? playerName.trim() : undefined,
          description,
        } as MatchEvent,
      ],
    };

    updateMatch(updatedMatch);
    setShowPlayerInput(null);
  };

  const handleKaratePoint = (team: "A" | "B", points: 1 | 2 | 3, typeLabel: string) => {
    if (!selectedMatch || selectedMatch.status === "finished") return;

    if (!selectedMatch.events?.some((e) => e.type === "start")) {
      const started = pushMatchEvent({
        type: "start",
        minute: getCurrentEventMinute(),
      });
      if (started) {
        selectedMatch.events = started.events;
      }
      setIsRunning(true);
    }

    const scoringTeamId =
      team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const currentA = selectedMatch.scoreA;
    const currentB = selectedMatch.scoreB;
    const nextA = team === "A" ? currentA + points : currentA;
    const nextB = team === "B" ? currentB + points : currentB;

    const description = `${typeLabel} (+${points}) conquistado por ${getSelectedMatchTeamShortName(team)}`;

    const updatedMatch: Match = {
      ...selectedMatch,
      scoreA: nextA,
      scoreB: nextB,
      status: "live",
      events: [
        ...(selectedMatch.events || []),
        {
          id: `evt_${Date.now()}_goal`,
          type: "goal",
          minute: getCurrentEventMinute(),
          teamId: scoringTeamId,
          description: description,
        } as MatchEvent,
      ],
    };

    updateMatch(updatedMatch);
  };

  const handleJudoPoint = (team: "A" | "B", type: "waza_ari" | "ippon", customDescription?: string) => {
    if (!selectedMatch || selectedMatch.status === "finished") return;

    if (!selectedMatch.events?.some((e) => e.type === "start")) {
      const started = pushMatchEvent({
        type: "start",
        minute: getCurrentEventMinute(),
      });
      if (started) {
        selectedMatch.events = started.events;
      }
      setIsRunning(true);
    }

    const scoringTeamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const teamName = team === "A" ? getTeamShortName(selectedMatch.teamA) : getTeamShortName(selectedMatch.teamB);

    if (type === "ippon" || isGoldenScore) {
      const victoryType = isGoldenScore ? "Ponto de Ouro" : (type === "ippon" ? "IPPON" : "Waza-ari-awasete-Ippon");
      const finalDesc = customDescription || `${victoryType}! Vitória para ${teamName}`;

      const updatedMatch: Match = {
        ...selectedMatch,
        scoreA: team === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA,
        scoreB: team === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB,
        status: "finished",
        events: [
          ...(selectedMatch.events || []),
          {
            id: `evt_${Date.now()}_point`,
            type: "goal",
            minute: getCurrentEventMinute(),
            teamId: scoringTeamId,
            description: finalDesc,
          } as MatchEvent,
          {
            id: `evt_${Date.now() + 1}_end`,
            type: "end",
            minute: getCurrentEventMinute(),
            description: `Fim de Luta (${isGoldenScore ? "Golden Score" : type.toUpperCase()}) - Vencedor: ${teamName}`,
          } as MatchEvent,
        ],
      };
      finishMatch(updatedMatch);
    } else {
      const currentWazaAris = selectedMatch.events?.filter(e => e.description?.includes("Waza-ari") && e.teamId === scoringTeamId).length || 0;

      if (currentWazaAris >= 1) {
        const updatedMatch: Match = {
          ...selectedMatch,
          scoreA: team === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA,
          scoreB: team === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB,
          status: "finished",
          events: [
            ...(selectedMatch.events || []),
            {
              id: `evt_${Date.now()}_waza_ari_2`,
              type: "goal",
              minute: getCurrentEventMinute(),
              teamId: scoringTeamId,
              description: customDescription || `Waza-ari-awasete-Ippon! Segundo Waza-ari para ${teamName}`,
            } as MatchEvent,
            {
              id: `evt_${Date.now() + 1}_end`,
              type: "end",
              minute: getCurrentEventMinute(),
              description: `Fim de Luta (Waza-ari-awasete-Ippon) - Vencedor: ${teamName}`,
            } as MatchEvent,
          ],
        };
        finishMatch(updatedMatch);
      } else {
        const updatedMatch: Match = {
          ...selectedMatch,
          scoreA: team === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA,
          scoreB: team === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB,
          events: [
            ...(selectedMatch.events || []),
            {
              id: `evt_${Date.now()}_waza_ari`,
              type: "goal",
              minute: getCurrentEventMinute(),
              teamId: scoringTeamId,
              description: customDescription || `Waza-ari para ${teamName}`,
            } as MatchEvent,
          ],
        };
        updateMatch(updatedMatch);
      }
    }
  };

  const handleJudoShido = (team: "A" | "B") => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;

    const teamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const opponentName = getMatchTeamShortName(selectedMatch, team === "A" ? "B" : "A");
    const teamName = getMatchTeamShortName(selectedMatch, team);

    const currentShidos = selectedMatch.events?.filter(e => e.type === "shido" && e.teamId === teamId).length || 0;

    if (currentShidos < 2) {
      const updatedMatch: Match = {
        ...selectedMatch,
        events: [
          ...(selectedMatch.events || []),
          {
            id: `evt_${Date.now()}_shido`,
            type: "shido",
            minute: getCurrentEventMinute(),
            teamId: teamId,
            description: `Shido ${currentShidos + 1} para ${teamName}`,
          } as MatchEvent,
        ],
      };
      updateMatch(updatedMatch);
    } else {
      const updatedMatch: Match = {
        ...selectedMatch,
        status: "finished",
        events: [
          ...(selectedMatch.events || []),
          {
            id: `evt_${Date.now()}_hansoku_make`,
            type: "hansoku_make",
            minute: getCurrentEventMinute(),
            teamId: teamId,
            description: `HANSOKU-MAKE! ${teamName} desclassificado (3 Shidos). Vitória para ${opponentName}`,
          } as MatchEvent,
          {
            id: `evt_${Date.now() + 1}_end`,
            type: "end",
            minute: getCurrentEventMinute(),
            description: `Fim de Luta por Hansoku-make - Vencedor: ${opponentName}`,
          } as MatchEvent,
        ],
      };
      finishMatch(updatedMatch);
    }
  };

  const handleOsaekomi = (team: "A" | "B") => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;
    if (osaekomiTeam) return; // Prevent double Osaekomi

    setOsaekomiTeam(team);
    setOsaekomiSeconds(0);

    const teamName = getMatchTeamShortName(selectedMatch, team);

    const updatedMatch: Match = {
      ...selectedMatch,
      events: [
        ...(selectedMatch.events || []),
        {
          id: `evt_${Date.now()}_osaekomi`,
          type: "osaekomi",
          minute: getCurrentEventMinute(),
          teamId: team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id,
          description: `Finalização iniciada por ${teamName}`,
        } as MatchEvent
      ]
    };
    updateMatch(updatedMatch);
  };

  const handleToketa = () => {
    if (!osaekomiTeam || !selectedMatch) return;

    const teamName = getMatchTeamShortName(selectedMatch, osaekomiTeam);

    setOsaekomiTeam(null);
    setOsaekomiSeconds(0);

    const updatedMatch: Match = {
      ...selectedMatch,
      events: [
        ...(selectedMatch.events || []),
        {
          id: `evt_${Date.now()}_toketa`,
          type: "toketa",
          minute: getCurrentEventMinute(),
          description: `Toketa! Finalização interrompida (${teamName})`,
        } as MatchEvent
      ]
    };
    updateMatch(updatedMatch);
  };

  const handleSenshu = (team: "A" | "B") => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;

    if (selectedMatch.events?.some(e => e.type === "senshu")) {
      showNotification("O Senshu (vantagem do primeiro ponto) já foi concedido nesta partida.");
      return;
    }

    const teamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const teamName = getMatchTeamShortName(selectedMatch, team);

    const updatedMatch: Match = {
      ...selectedMatch,
      status: "live",
      events: [
        ...(selectedMatch.events || []),
        {
          id: `evt_${Date.now()}_senshu`,
          type: "senshu",
          minute: getCurrentEventMinute(),
          teamId: teamId,
          description: `Senshu conquistado por ${teamName}`,
        } as MatchEvent,
      ],
    };
    updateMatch(updatedMatch);
  };

  const handleKaratePenalty = (team: "A" | "B") => {
    if (!selectedMatch || selectedMatch.status === "finished") return;

    if (!selectedMatch.events?.some((e) => e.type === "start")) {
      const started = pushMatchEvent({
        type: "start",
        minute: getCurrentEventMinute(),
      });
      if (started) {
        selectedMatch.events = started.events;
      }
      setIsRunning(true);
    }

    const teamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const teamName = getMatchTeamShortName(selectedMatch, team);
    const opponentName = getMatchTeamShortName(selectedMatch, team === "A" ? "B" : "A");

    if (selectedMatch.events?.some(e => e.type === "hansoku" && e.teamId === teamId)) {
      return;
    }

    const currentPenalties = selectedMatch.events?.filter(e => e.type === "chui" && e.teamId === teamId).length || 0;

    if (currentPenalties < 3) {
      const updatedMatch: Match = {
        ...selectedMatch,
        events: [
          ...(selectedMatch.events || []),
          {
            id: `evt_${Date.now()}_chui`,
            type: "chui",
            minute: getCurrentEventMinute(),
            teamId: teamId,
            description: `Advertência: Chui ${currentPenalties + 1} para ${teamName}`,
          } as MatchEvent,
        ],
      };
      updateMatch(updatedMatch);
    } else {
      const updatedMatch: Match = {
        ...selectedMatch,
        status: "finished",
        events: [
          ...(selectedMatch.events || []),
          {
            id: `evt_${Date.now()}_hansoku`,
            type: "hansoku",
            minute: getCurrentEventMinute(),
            teamId: teamId,
            description: `HANSOKU! ${teamName} desclassificado. Vitória para ${opponentName}`,
          } as MatchEvent,
          {
            id: `evt_${Date.now() + 1}_end`,
            type: "end",
            minute: getCurrentEventMinute(),
            description: `Fim de Jogo por Hansoku - Vitória: ${opponentName}`,
          } as MatchEvent,
        ],
      };
      finishMatch(updatedMatch);
    }
  };

  const handleHantei = (team: "A" | "B") => {
    if (!selectedMatch) return;
    if (!requireGameStarted()) return;
    const winnerName = getMatchTeamShortName(selectedMatch, team);

    const endEvent: MatchEvent = {
      id: `evt_${Date.now()}_end_hantei`,
      type: "end",
      minute: getCurrentEventMinute(),
      description: `Luta Encerrada (Hantei). Vitória por Decisão Arbitral: ${winnerName}`,
    };

    const finishedMatch: Match = {
      ...selectedMatch,
      status: "finished",
      events: [...(selectedMatch.events || []), endEvent],
    };

    finishMatch(finishedMatch);
  };

  const handleChessResult = (result: "A" | "B" | "Draw", reason: string) => {
    if (!selectedMatch) return;
    if (!requireGameStarted()) return;

    let scoreA = 0;
    let scoreB = 0;
    let description = "";
    let teamId = undefined;
    let resultado = "";

    if (result === "A") {
      scoreA = 1;
      description = `${reason} (+1.0 pts) - Vitória de ${getTeamShortName(selectedMatch.teamA)}`;
      teamId = selectedMatch.teamA.id;
      resultado = getTeamShortName(selectedMatch.teamA);
    } else if (result === "B") {
      scoreB = 1;
      description = `${reason} (+1.0 pts) - Vitória de ${getTeamShortName(selectedMatch.teamB)}`;
      teamId = selectedMatch.teamB.id;
      resultado = getTeamShortName(selectedMatch.teamB);
    } else if (result === "Draw") {
      scoreA = 0.5;
      scoreB = 0.5;
      description = `${reason} (+0.5 pts) - Empate`;
      resultado = "Empate";
    }

    const events: MatchEvent[] = [...(selectedMatch.events || [])];

    events.push({
      id: `evt_${Date.now()}_chess_win`,
      type: "chess_result",
      minute: getCurrentEventMinute(),
      teamId,
      description,
    } as MatchEvent);

    const endEvent: MatchEvent = {
      id: `evt_${Date.now() + 2}_end_chess`,
      type: "end",
      minute: getCurrentEventMinute(),
      description: `Fim de Jogo (${reason}). Resultado: ${resultado}`,
    };

    const finishedMatch: Match = {
      ...selectedMatch,
      scoreA,
      scoreB,
      status: "finished",
      events: [...events, endEvent],
    };

    finishMatch(finishedMatch);
  };

  const handleTamboreauPoint = (team: "A" | "B") => {
    if (!selectedMatch || selectedMatch.status === "finished") return;
    if (!requireGameStarted()) return;

    const existingEvents = selectedMatch.events || [];
    const currentSetNumber = existingEvents.filter((e) => e.type === "set_win").length + 1;

    const currentA = team === "A" ? tamboreauPointsA + 1 : tamboreauPointsA;
    const currentB = team === "B" ? tamboreauPointsB + 1 : tamboreauPointsB;

    const maxPoints = 12;
    const winPoints = 10;

    const aWins =
      (currentA >= winPoints && currentA - currentB >= 2) || currentA >= maxPoints;
    const bWins =
      (currentB >= winPoints && currentB - currentA >= 2) || currentB >= maxPoints;

    if (aWins || bWins) {
      const winner = aWins ? "A" : "B";
      const winnerId = winner === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
      const winnerName = getSelectedMatchTeamShortName(winner);
      const loserName = getSelectedMatchTeamShortName(winner === "A" ? "B" : "A");

      const newScoreA = winner === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA;
      const newScoreB = winner === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB;

      // Resultado do set: ex "Set 1: Direito 10 x 08 Enfermagem"
      const setResultDesc =
        winner === "A"
          ? `Set ${currentSetNumber}: ${winnerName} ${currentA} x ${currentB} ${loserName}`
          : `Set ${currentSetNumber}: ${loserName} ${currentB} x ${currentA} ${winnerName}`;

      const setWinEvent: MatchEvent = {
        id: `evt_${Date.now()}_setwin`,
        type: "set_win",
        minute: getCurrentEventMinute(),
        teamId: winnerId,
        description: setResultDesc,
        score: `${newScoreA}x${newScoreB}`,
      };

      const newEvents = [...existingEvents, setWinEvent];

      // Regra melhor de 3: quem chegar a 2 sets vence a partida
      const matchOver = newScoreA >= 2 || newScoreB >= 2;

      if (matchOver) {
        const matchWinnerName = getSelectedMatchTeamShortName(newScoreA >= 2 ? "A" : "B");
        const endEvent: MatchEvent = {
          id: `evt_${Date.now() + 1}_end`,
          type: "end",
          minute: getCurrentEventMinute(),
          description: `Fim de Jogo - ${matchWinnerName} vence por ${newScoreA} x ${newScoreB} sets`,
        };

        const finishedMatch: Match = {
          ...selectedMatch,
          scoreA: newScoreA,
          scoreB: newScoreB,
          status: "finished",
          events: [...newEvents, endEvent],
        };

        finishMatch(finishedMatch);
        setTamboreauPointsA(0);
        setTamboreauPointsB(0);
        setTamboreauMatchWinner({ name: matchWinnerName, setsA: newScoreA, setsB: newScoreB });
      } else {
        const updatedMatch: Match = {
          ...selectedMatch,
          scoreA: newScoreA,
          scoreB: newScoreB,
          status: "live",
          events: newEvents,
        };
        updateMatch(updatedMatch);
        setTamboreauPointsA(0);
        setTamboreauPointsB(0);
        showNotification(`🏆 Set ${currentSetNumber} para ${winnerName}! (${setResultDesc})`, "success");
      }
    } else {
      setTamboreauPointsA(currentA);
      setTamboreauPointsB(currentB);

      const teamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
      const teamName = getSelectedMatchTeamShortName(team);

      const pointEvent: MatchEvent = {
        id: `evt_${Date.now()}_goal`,
        type: "goal",
        minute: getCurrentEventMinute(),
        teamId,
        description: `Ponto para ${teamName} (${currentA} x ${currentB})`,
      };

      const updatedMatch: Match = {
        ...selectedMatch,
        status: "live",
        events: [...existingEvents, pointEvent],
      };

      updateMatch(updatedMatch);
    }
  };

  const handleGoal = (team: "A" | "B") => {
    if (!requireGameStarted()) return;
    if (isBeachTennis) {
      handleBeachPoint(team);
      return;
    }

    if (isFutebolX1 && selectedMatch) {
      const teamObj = team === "A" ? selectedMatch.teamA : selectedMatch.teamB;
      const availableAthletes = athletes.filter((a) =>
        athleteMatchesTeamAndMatch(a, teamObj, selectedMatch),
      );
      if (availableAthletes.length > 0) {
        const playerName = `${availableAthletes[0].firstName} ${availableAthletes[0].lastName}`;
        const teamId =
          team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        addEvent("goal", teamId, playerName);
        return;
      }
    }

    setShowPlayerInput({ type: "goal", team });
  };

  const handleCard = (type: "yellow_card" | "red_card", team: "A" | "B") => {
    if (!requireGameStarted()) return;
    if (isFutebolX1 && selectedMatch) {
      const teamObj = team === "A" ? selectedMatch.teamA : selectedMatch.teamB;
      const availableAthletes = athletes.filter((a) =>
        athleteMatchesTeamAndMatch(a, teamObj, selectedMatch),
      );
      if (availableAthletes.length > 0) {
        const playerName = `${availableAthletes[0].firstName} ${availableAthletes[0].lastName}`;
        const teamId =
          team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        addEvent(type, teamId, playerName);
        return;
      }
    }
    setShowPlayerInput({ type, team });
  };

  const handlePenalty = (
    type: "penalty_scored" | "penalty_missed",
    team: "A" | "B",
  ) => {
    if (!requireGameStarted()) return;
    if (type === "penalty_scored") {
      if (isFutebolX1 && selectedMatch) {
        const teamObj =
          team === "A" ? selectedMatch.teamA : selectedMatch.teamB;
        const availableAthletes = athletes.filter((a) =>
          athleteMatchesTeamAndMatch(a, teamObj, selectedMatch),
        );
        if (availableAthletes.length > 0) {
          const playerName = `${availableAthletes[0].firstName} ${availableAthletes[0].lastName}`;
          const teamId =
            team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
          addEvent(type, teamId, playerName);
          return;
        }
      }
      setShowPlayerInput({ type, team });
    } else {
      // Pênalti perdido: abre modal para selecionar o jogador
      setShowPlayerInput({ type, team });
    }
  };

  const handleShootout = (
    type: "shootout_scored" | "shootout_missed",
    team: "A" | "B",
  ) => {
    if (!selectedMatch) return;

    // Se há shoot-out pendente, só o time correto pode cobrar
    if (pendingShootout && team !== pendingShootout.team) return;

    const teamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const teamName = getSelectedMatchTeamShortName(team);
    const isScored = type === "shootout_scored";

    const newScoreA = isScored && team === "A" ? selectedMatch.scoreA + 1 : selectedMatch.scoreA;
    const newScoreB = isScored && team === "B" ? selectedMatch.scoreB + 1 : selectedMatch.scoreB;
    const scoreLabel = `${newScoreA}x${newScoreB}`;

    const desc = isScored
      ? `🎯 Shoot-out Marcado! Placar no momento: ${scoreLabel} - ${teamName}`
      : `❌ Shoot-out Perdido - ${teamName}`;

    const shootoutEvent: MatchEvent = {
      id: `evt_${Date.now()}_shootout`,
      type,
      minute: getCurrentEventMinute(),
      teamId,
      description: desc,
    };

    // Se era pendente por 2º amarelo, limpa o pending
    if (pendingShootout) {
      updateMatch({
        ...selectedMatch,
        events: [...(selectedMatch.events || []), shootoutEvent],
        scoreA: newScoreA,
        scoreB: newScoreB,
      });
      setPendingShootout(null);
      return;
    }

    addEvent(type, teamId);
  };

  const handleStartPenaltyShootout = (firstTeam: "A" | "B" = "A") => {
    if (!selectedMatch) return;
    setShootoutFirstTeam(firstTeam);
    const startEvent: MatchEvent = {
      id: `evt_${Date.now()}_shootout_start`,
      type: "halftime",
      minute: getCurrentEventMinute(),
      description: `⚽ Início da Disputa de Pênaltis|first=${firstTeam}`,
    };
    updateMatch({
      ...selectedMatch,
      events: [...(selectedMatch.events || []), startEvent],
    });
    setPenaltyShootoutActive(true);
  };

  const handleShootoutPenalty = (type: "penalty_scored" | "penalty_missed", team: "A" | "B") => {
    if (!selectedMatch) return;
    // Abre modal de seleção de atleta para ambos os casos
    setShowPlayerInput({ type, team, isShootout: true });
  };

  const confirmShootoutPenalty = (type: "penalty_scored" | "penalty_missed", team: "A" | "B", playerName: string) => {
    if (!selectedMatch) return;
    const teamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const teamName = getSelectedMatchTeamShortName(team);

    const { scoredA, scoredB, totalA, totalB } = shootoutStats;
    const nextScoredA = type === "penalty_scored" && team === "A" ? scoredA + 1 : scoredA;
    const nextScoredB = type === "penalty_scored" && team === "B" ? scoredB + 1 : scoredB;
    const nextTotalA = team === "A" ? totalA + 1 : totalA;
    const nextTotalB = team === "B" ? totalB + 1 : totalB;

    const desc = type === "penalty_scored"
      ? `🎯 ${playerName} converteu! ${teamName} (${nextScoredA} x ${nextScoredB})`
      : `❌ ${playerName} perdeu! ${teamName} (${nextScoredA} x ${nextScoredB})`;

    const newEvent: MatchEvent = {
      id: `evt_${Date.now()}_pen`,
      type,
      minute: getCurrentEventMinute(),
      teamId,
      player: playerName,
      description: desc,
    };

    const updatedEvents = [...(selectedMatch.events || []), newEvent];
    const SERIES = isFutebolX1 ? 0 : 3; // X1: morte súbita desde o início
    let matchOver = false;
    let winner: "A" | "B" | null = null;

    if (isFutebolX1) {
      // Morte súbita pura: rodada completa quando ambos cobram 1
      if (nextTotalA === nextTotalB) {
        if (nextScoredA > nextScoredB) { matchOver = true; winner = "A"; }
        else if (nextScoredB > nextScoredA) { matchOver = true; winner = "B"; }
        // Empate na rodada → próxima rodada
      } else {
        // Um cobrou, o outro ainda não — vitória antecipada se impossível alcançar
        if (team === "A" && nextScoredA > nextScoredB + 1) { matchOver = true; winner = "A"; }
        if (!matchOver && team === "B" && nextScoredB > nextScoredA + 1) { matchOver = true; winner = "B"; }
      }
    } else {
      // Futsal / Futebol Society: série de 3 + morte súbita
      const remainingInSeriesA = Math.max(0, SERIES - nextTotalA);
      const remainingInSeriesB = Math.max(0, SERIES - nextTotalB);
      const inInitialSeries = nextTotalA < SERIES || nextTotalB < SERIES;

      if (inInitialSeries) {
        if (nextScoredB > nextScoredA + remainingInSeriesA) { matchOver = true; winner = "B"; }
        if (!matchOver && nextScoredA > nextScoredB + remainingInSeriesB) { matchOver = true; winner = "A"; }
        if (!matchOver && nextTotalA === SERIES && nextTotalB === SERIES) {
          if (nextScoredA > nextScoredB) { matchOver = true; winner = "A"; }
          else if (nextScoredB > nextScoredA) { matchOver = true; winner = "B"; }
        }
      } else {
        if (nextTotalA === nextTotalB) {
          if (nextScoredA > nextScoredB) { matchOver = true; winner = "A"; }
          else if (nextScoredB > nextScoredA) { matchOver = true; winner = "B"; }
        } else {
          if (team === "A" && nextScoredA > nextScoredB + (nextTotalB < nextTotalA ? 1 : 0)) { matchOver = true; winner = "A"; }
          if (!matchOver && team === "B" && nextScoredB > nextScoredA + (nextTotalA < nextTotalB ? 1 : 0)) { matchOver = true; winner = "B"; }
        }
      }
    }

    if (matchOver && winner) {
      const winnerName = getSelectedMatchTeamShortName(winner);
      const endEvent: MatchEvent = {
        id: `evt_${Date.now() + 1}_end`,
        type: "end",
        minute: getCurrentEventMinute(),
        description: `🏆 Fim da Disputa de Pênaltis — ${winnerName} vence (${nextScoredA} x ${nextScoredB})`,
      };
      finishMatch({ ...selectedMatch, events: [...updatedEvents, endEvent], status: "finished" });
      setPenaltyShootoutActive(false);
      navigate("/");
    } else {
      updateMatch({ ...selectedMatch, events: updatedEvents });
    }
    setShowPlayerInput(null);
  };

  const confirmPlayerEvent = (playerName: string) => {
    if (!showPlayerInput || !selectedMatch || !playerName.trim()) return;

    if (isBasketball) {
      confirmBasketballPoint(playerName);
      return;
    }

    if (showPlayerInput.isShootout) {
      confirmShootoutPenalty(
        showPlayerInput.type as "penalty_scored" | "penalty_missed",
        showPlayerInput.team,
        playerName.trim(),
      );
      return;
    }

    if (showPlayerInput.type === "penalty_missed") {
      const teamId =
        showPlayerInput.team === "A"
          ? selectedMatch.teamA.id
          : selectedMatch.teamB.id;
      addEvent(showPlayerInput.type, teamId, playerName.trim());
      setShowPlayerInput(null);
      return;
    }

    const teamId =
      showPlayerInput.team === "A"
        ? selectedMatch.teamA.id
        : selectedMatch.teamB.id;
    addEvent(showPlayerInput.type, teamId, playerName.trim());

    setShowPlayerInput(null);
  };

  const cancelPlayerInput = () => {
    setShowPlayerInput(null);
  };

  // Obter estatísticas de um jogador
  const getPlayerStats = (playerName: string) => {
    if (!selectedMatch?.events)
      return { goals: 0, points: 0, yellowCards: 0, redCards: 0, canPlay: true };

    const playerEvents = selectedMatch.events.filter(
      (e) => e.player === playerName,
    );
    const goals = playerEvents.filter(
      (e) => e.type === "goal" || e.type === "penalty_scored",
    ).length;
    // Para basquete, somar os pontos reais de cada evento
    const points = isBasketball
      ? playerEvents
        .filter((e) => e.type === "goal")
        .reduce((sum, e) => {
          const pts = Number(e.description?.match(/\+(\d+)/)?.[1] || 1);
          return sum + pts;
        }, 0)
      : goals;
    const yellowCards = playerEvents.filter(
      (e) => e.type === "yellow_card",
    ).length;
    const redCards = playerEvents.filter((e) => e.type === "red_card").length;
    const canPlay = redCards === 0;

    return { goals, points, yellowCards, redCards, canPlay };
  };

  const handleResetMatch = () => {
    if (!selectedMatch) return;

    const resetMatch: Match = {
      ...selectedMatch,
      scoreA: 0,
      scoreB: 0,
      events: [],
      status: "scheduled",
    };

    updateMatch(resetMatch);
    setCurrentMinute(
      isBasketball ? getBasketballQuarterDurationSeconds(selectedMatch) : 0,
    );
    setIsRunning(false);
    setShowResetConfirm(false);
  };

  const timelineEvents = selectedMatch
    ? getTimelineScoreLabel(selectedMatch.events || [], {
      selectedMatch,
      isSwimming,
      isBasketball,
      isBeachTennis,
      isSetSport,
      isTamboreu,
      isKarate,
      isJudo,
    })
    : [];

  const storedSwimmingParticipants = getStoredSwimmingParticipants(selectedMatch);
  const swimmingEntries = isSwimming ? getSwimmingEntries(selectedMatch) : [];
  const maxSwimmingRank = swimmingEntries.length > 0 ? swimmingEntries.length : 8;

  const handleSaveNewMatch = () => {
    const isSwimming = newMatchForm.sport === "Natação";

    if (isSwimming) {
      const selectedSwimmingTeams = newMatchForm.swimmingTeams.filter(
        (t) => t !== "",
      );
      if (selectedSwimmingTeams.length < 2) {
        showNotification("Selecione pelo menos 2 cursos para a natação!");
        return;
      }
      if (
        new Set(selectedSwimmingTeams).size !== selectedSwimmingTeams.length
      ) {
        showNotification("Não é permitido selecionar o mesmo curso mais de uma vez!");
        return;
      }
      if (
        !newMatchForm.sport ||
        !newMatchForm.time ||
        !newMatchForm.location ||
        !newMatchForm.date
      ) {
        showNotification("Preencha todos os campos!");
        return;
      }
    } else {
      if (
        !newMatchForm.teamA ||
        !newMatchForm.teamB ||
        !newMatchForm.sport ||
        !newMatchForm.time ||
        !newMatchForm.location ||
        !newMatchForm.date
      ) {
        showNotification("Preencha todos os campos!");
        return;
      }
      if (newMatchForm.teamA === newMatchForm.teamB) {
        showNotification("Uma equipe não pode enfrentar ela mesma!");
        return;
      }
    }

    let newMatch: Match;

    if (isSwimming) {
      const participants = newMatchForm.swimmingTeams
        .filter((t) => t !== "")
        .map((course, idx) => {
          const [name, faculty] = course.split(" - ");
          return {
            id: `t_${Date.now()}_swim_${idx}`,
            name: name,
            course: course,
            faculty: faculty,
            logo: getTeamEmblem(course) ?? undefined,
          };
        });

      newMatch = {
        id: crypto.randomUUID(),
        sport: newMatchForm.sport,
        category: newMatchForm.category,
        stage: newMatchForm.stage || "Fase de Classificação",
        status: "scheduled",
        date: newMatchForm.date,
        time: newMatchForm.time,
        location: newMatchForm.location,
        events: [],
        participants: participants,
        // Dummy teams for compatibility with existing UI that might expect teamA/teamB
        teamA: participants[0],
        teamB: participants[1],
        scoreA: 0,
        scoreB: 0,
      };
    } else {
      const [nameA, universityA] = newMatchForm.teamA.split(" - ");
      const [nameB, universityB] = newMatchForm.teamB.split(" - ");

      if (!emblemA || !emblemB) {
        showNotification(
          "Atenção: Um ou ambos os cursos não possuem emblema configurado. Verifique o banco de dados.",
        );
        return;
      }

      newMatch = {
        id: crypto.randomUUID(),
        teamA: {
          id: `t_${Date.now()}_A`,
          name: nameA,
          course: newMatchForm.teamA,
          faculty: universityA,
          logo: emblemA,
        },
        teamB: {
          id: `t_${Date.now()}_B`,
          name: nameB,
          course: newMatchForm.teamB,
          faculty: universityB,
          logo: emblemB,
        },
        scoreA: 0,
        scoreB: 0,
        sport: newMatchForm.sport,
        category: newMatchForm.category,
        stage: newMatchForm.stage || "Fase de Classificação",
        status: "scheduled",
        date: newMatchForm.date,
        time: newMatchForm.time,
        location: newMatchForm.location,
        events: [],
      };
    }

    addMatch(newMatch);
    setIsNewMatchOpen(false);
    setEmblemA(null);
    setEmblemB(null);
    setNewMatchForm({
      teamA: "",
      teamB: "",
      swimmingTeams: Array(8).fill(""),
      sport: "",
      category: "Masculino",
      stage: "Fase de Classificação",
      date: new Date().toISOString().split("T")[0],
      time: "",
      location: "",
    });
  };

  if (!selectedMatch) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <h1 style={styles.title}>⚽ Controle de Partida</h1>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={async () => {
                  const scheduled = matches.filter(m => m.status === "scheduled");
                  if (scheduled.length === 0) {
                    showNotification("Nenhuma partida agendada para excluir.", "error");
                    return;
                  }
                  if (window.confirm(`Excluir todas as ${scheduled.length} partidas agendadas? Esta ação não pode ser desfeita.`)) {
                    await deleteScheduledMatches();
                    showNotification("Todas as partidas agendadas foram excluídas.", "success");
                  }
                }}
                style={{
                  background: "transparent",
                  color: "#ef4444",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ef444460",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <Trash2 size={16} /> Excluir Agendadas
              </button>
              <button
                onClick={() => {
                  setIsNewMatchOpen(true);
                  // Limpar cache de emblemas ao abrir formulário
                  setEmblemA(null);
                  setEmblemB(null);
                  // Resetar form para garantir campos limpos
                  setNewMatchForm({
                    teamA: "",
                    teamB: "",
                    swimmingTeams: Array(8).fill(""),
                    sport: "",
                    category: "Masculino",
                    stage: "Fase de Classificação",
                    date: new Date().toISOString().split("T")[0],
                    time: "",
                    location: "",
                  });
                }}
                style={{
                  background: "var(--accent-color)",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <PlusCircle size={18} /> Nova Partida
              </button>
            </div>
          </div>
        </div>

        <div style={styles.content}>
          {/* Filters Bar */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "30px",
              background: "rgba(255,255,255,0.03)",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                width: "100%",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--accent-color)",
              }}
            >
              <Filter size={18} />
              <span style={{ fontSize: "14px", fontWeight: 800 }}>
                FILTRAR PARTIDAS
              </span>
            </div>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                MODALIDADE
              </label>
              <select
                value={filterSport}
                onChange={(e) => setFilterSport(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "var(--bg-card)",
                  color: "white",
                  border: "1px solid var(--border-color)",
                }}
              >
                <option value="Todos">Todas as Modalidades</option>
                {sportsOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                LOCAL
              </label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "var(--bg-card)",
                  color: "white",
                  border: "1px solid var(--border-color)",
                }}
              >
                <option value="Todos">Todos os Locais</option>
                {locationOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                GÊNERO
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "var(--bg-card)",
                  color: "white",
                  border: "1px solid var(--border-color)",
                }}
              >
                <option value="Todos">Todos</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 style={styles.subtitle}>Partidas Agendadas ou Ao Vivo:</h2>
          <div style={styles.matchList}>
            {filteredMatches.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px",
                  color: "var(--text-secondary)",
                }}
              >
                <Clock
                  size={48}
                  style={{ opacity: 0.1, marginBottom: "20px" }}
                />
                <p>Nenhuma partida encontrada com esses filtros.</p>
              </div>
            ) : (
              filteredMatches.map((match: Match) => (
                <div
                  key={match.id}
                  style={{
                    ...styles.matchItem,
                    borderLeft:
                      match.status === "live"
                        ? "4px solid var(--live-color)"
                        : "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                  onClick={() => handleSelectMatch(match)}
                >
                  <div
                    style={{
                      ...styles.matchInfo,
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <span style={styles.sportBadge}>{match.sport} {match.category}</span>
                      {match.status === "live" && (
                        <span
                          style={{
                            ...styles.liveBadge,
                            position: "static",
                            margin: 0,
                            fontSize: "10px",
                          }}
                        >
                          AO VIVO
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Certeza que deseja excluir esta partida?")) {
                            deleteMatch(match.id);
                            showNotification("Partida excluída com sucesso!", "success");
                          }
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--danger-color, #ff4444)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                        }}
                        title="Excluir partida"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "20px",
                      padding: "10px 0",
                      minHeight: "80px",
                    }}
                  >
                    {match.sport === "Natação" ? (
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "28px",
                            color: "var(--accent-color)",
                            fontWeight: 900,
                            letterSpacing: "2px",
                            textShadow: "0 0 15px rgba(59, 130, 246, 0.3)",
                          }}
                        >
                          🏊 NATAÇÃO
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            marginTop: "4px",
                            textTransform: "uppercase",
                          }}
                        >
                          Prova com Múltiplas Equipes
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            flex: 1,
                            textAlign: "right",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "8px",
                          }}
                        >
                          {(() => {
                            const emblem = getTeamEmblem(match.teamA);
                            return emblem ? (
                              <img
                                src={emblem}
                                alt=""
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  background: "rgba(255,255,255,0.05)",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "20px",
                                }}
                              >
                                🛡️
                              </div>
                            );
                          })()}
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              textAlign: "right",
                            }}
                          >
                            {getTeamShortName(match.teamA)}
                          </span>
                          {getMatchTeamSuffixName(match, "A") && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                textAlign: "right",
                                marginTop: "-4px"
                              }}
                            >
                              {getMatchTeamSuffixName(match, "A")}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 800,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {match.status === "live" ? (
                            <span
                              style={{
                                color: "var(--accent-color)",
                                fontSize: "24px",
                              }}
                            >
                              {match.scoreA} x {match.scoreB}
                            </span>
                          ) : (
                            "VS"
                          )}
                        </div>

                        <div
                          style={{
                            flex: 1,
                            textAlign: "left",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "8px",
                          }}
                        >
                          {(() => {
                            const emblem = getTeamEmblem(match.teamB);
                            return emblem ? (
                              <img
                                src={emblem}
                                alt=""
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  background: "rgba(255,255,255,0.05)",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "20px",
                                }}
                              >
                                🛡️
                              </div>
                            );
                          })()}
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              textAlign: "left",
                            }}
                          >
                            {getTeamShortName(match.teamB)}
                          </span>
                          {getMatchTeamSuffixName(match, "B") && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                textAlign: "left",
                                marginTop: "-4px"
                              }}
                            >
                              {getMatchTeamSuffixName(match, "B")}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    style={{
                      ...styles.matchDateTime,
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      paddingTop: "10px",
                    }}
                  >
                    <span>📍 {match.location.replace(/\s*\(.*?\)\s*$/, '').trim()}</span>
                    <span>
                      📅 {match.date.split('-').reverse().join('-')} - {match.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Nova Partida */}
        {isNewMatchOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.9)",
              zIndex: 1000,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "8px",
              overflowY: "auto",
            }}
            className="new-match-overlay"
          >
            <div
              style={{
                width: "100%",
                maxWidth: "440px",
                background: "#111",
                borderRadius: "16px",
                border: "1px solid #333",
                padding: "16px",
                boxSizing: "border-box",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                margin: "auto 0",
                maxHeight: "calc(100dvh - 16px)",
                overflowY: "auto",
              }}
              className="new-match-modal custom-scrollbar"
            >
              <h2
                style={{
                  fontSize: "clamp(22px, 4vw, 28px)",
                  fontWeight: 800,
                  color: "white",
                  marginBottom: "16px",
                  lineHeight: 1.15,
                }}
              >
                Nova Partida
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
                className="new-match-form"
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#888",
                      marginBottom: "8px",
                    }}
                  >
                    Modalidade *
                  </label>
                  <select
                    value={newMatchForm.sport}
                    onChange={(e) => {
                      const selectedSport = e.target.value;
                      let nextLocation = newMatchForm.location;

                      if (FIXED_LOCATIONS[selectedSport]) {
                        nextLocation = FIXED_LOCATIONS[selectedSport];
                      } else if (FILTERED_LOCATIONS[selectedSport] && !FILTERED_LOCATIONS[selectedSport].includes(nextLocation)) {
                        nextLocation = "";
                      }

                      setNewMatchForm({
                        ...newMatchForm,
                        sport: selectedSport,
                        location: nextLocation,
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      background: "#222",
                      border: "1px solid #333",
                      color: "white",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">Selecione a Modalidade</option>
                    {AVAILABLE_SPORTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {newMatchForm.sport === "Natação" ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#888",
                      }}
                    >
                      Cursos Participantes (Até 8) *
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        padding: "5px",
                      }}
                      className="custom-scrollbar"
                    >
                      {newMatchForm.swimmingTeams.map((team, idx) => (
                        <select
                          key={idx}
                          value={team}
                          onChange={(e) => {
                            const newTeams = [...newMatchForm.swimmingTeams];
                            newTeams[idx] = e.target.value;
                            setNewMatchForm({
                              ...newMatchForm,
                              swimmingTeams: newTeams,
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "8px",
                            background: "#222",
                            border: "1px solid #333",
                            color: "white",
                            fontSize: "12px",
                          }}
                        >
                          <option value="">Equipe {idx + 1}</option>
                          {coursesList.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#888",
                          marginBottom: "8px",
                        }}
                      >
                        Equipe A *
                      </label>
                      <select
                        value={newMatchForm.teamA}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewMatchForm((prev) => ({
                            ...prev,
                            teamA: val,
                            teamB: prev.teamB === val ? '' : prev.teamB,
                          }));
                          setEmblemA(val ? getTeamEmblem(val) : null);
                          if (newMatchForm.teamB === val) setEmblemB(null);
                        }}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "8px",
                          background: "#222",
                          border: "1px solid #333",
                          color: "white",
                          fontSize: "14px",
                        }}
                      >
                        <option value="">Selecione a Equipe A</option>
                        {coursesList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {emblemA && (
                        <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            color: "#888",
                          }}
                        >
                          <img
                            src={emblemA}
                            alt="Emblema A"
                            style={{
                              width: "24px",
                              height: "24px",
                              objectFit: "contain",
                            }}
                          />
                          <span>Emblema carregado ✓</span>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#555",
                        margin: "-5px 0",
                      }}
                    >
                      X
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#888",
                          marginBottom: "8px",
                        }}
                      >
                        Equipe B *
                      </label>
                      <select
                        value={newMatchForm.teamB}
                        onChange={(e) => {
                          setNewMatchForm({
                            ...newMatchForm,
                            teamB: e.target.value,
                          });
                          setEmblemB(
                            e.target.value
                              ? getTeamEmblem(e.target.value)
                              : null,
                          );
                        }}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "8px",
                          background: "#222",
                          border: "1px solid #333",
                          color: "white",
                          fontSize: "14px",
                        }}
                      >
                        <option value="">Selecione a Equipe B</option>
                        {coursesList.filter((c) => c !== newMatchForm.teamA).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {emblemB && (
                        <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            color: "#888",
                          }}
                        >
                          <img
                            src={emblemB}
                            alt="Emblema B"
                            style={{
                              width: "24px",
                              height: "24px",
                              objectFit: "contain",
                            }}
                          />
                          <span>Emblema carregado ✓</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <select
                    value={newMatchForm.stage}
                    onChange={(e) =>
                      setNewMatchForm({
                        ...newMatchForm,
                        stage: e.target.value as "Fase de Classificação" | "Fase Final",
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      background: "#222",
                      border: "1px solid #333",
                      color: "white",
                      fontSize: "14px",
                    }}
                  >
                    <option value="Fase de Classificação">Fase de Classificação</option>
                    <option value="Fase Final">Fase Final</option>
                  </select>

                  <select
                    value={newMatchForm.category}
                    onChange={(e) =>
                      setNewMatchForm({
                        ...newMatchForm,
                        category: e.target.value as "Masculino" | "Feminino",
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      background: "#222",
                      border: "1px solid #333",
                      color: "white",
                      fontSize: "14px",
                    }}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                  className="new-match-two-cols"
                >
                  <input
                    type="date"
                    value={newMatchForm.date}
                    onChange={(e) =>
                      setNewMatchForm({ ...newMatchForm, date: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      background: "#222",
                      border: "1px solid #333",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                  <input
                    type="time"
                    value={newMatchForm.time}
                    onChange={(e) =>
                      setNewMatchForm({ ...newMatchForm, time: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      background: "#222",
                      border: "1px solid #333",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <select
                  value={newMatchForm.location}
                  disabled={!!FIXED_LOCATIONS[newMatchForm.sport]}
                  onChange={(e) =>
                    setNewMatchForm({
                      ...newMatchForm,
                      location: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    background: !!FIXED_LOCATIONS[newMatchForm.sport] ? "#1a1a1a" : "#222",
                    border: "1px solid #333",
                    color: !!FIXED_LOCATIONS[newMatchForm.sport] ? "#666" : "white",
                    fontSize: "14px",
                    opacity: !!FIXED_LOCATIONS[newMatchForm.sport] ? 0.7 : 1,
                    cursor: !!FIXED_LOCATIONS[newMatchForm.sport] ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">
                    {FIXED_LOCATIONS[newMatchForm.sport] ? FIXED_LOCATIONS[newMatchForm.sport] : "Selecione o Local"}
                  </option>
                  {OFFICIAL_LOCATIONS.filter((l) => {
                    if (FILTERED_LOCATIONS[newMatchForm.sport]) {
                      return FILTERED_LOCATIONS[newMatchForm.sport].includes(l);
                    }
                    return true;
                  }).map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>

                <div
                  style={{ display: "flex", gap: "12px", marginTop: "6px" }}
                  className="new-match-actions"
                >
                  <button
                    onClick={handleSaveNewMatch}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: "8px",
                      background: "var(--accent-color)",
                      color: "white",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "15px",
                    }}
                  >
                    Salvar Partida
                  </button>
                  <button
                    onClick={() => setIsNewMatchOpen(false)}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: "8px",
                      background: "#222",
                      color: "white",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "15px",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="match-timeline-layout">
      <div style={styles.container} className="match-timeline-root match-timeline-root-pane">
        <div style={styles.header} className="match-timeline-header">
          <div className="match-timeline-header-row">
            <div>
              <h1 style={styles.title}>⚽ Controle de Partida</h1>
              <button
                style={styles.changeMatchBtn}
                className="change-match-btn-hover"
                onClick={() => setActiveMatchId(null)}
              >
                <ChevronLeft size={16} />
                Trocar partida
              </button>
            </div>
            <div className="match-timeline-header-actions">
              <button
                style={styles.resetBtn}
                className="reset-btn-hover"
                onClick={() => setShowResetConfirm(true)}
              >
                🔄 Resetar Partida
              </button>
            </div>
          </div>
        </div>

        <div style={styles.content} className="match-timeline-content">
          {/* Placar */}
          <div style={styles.scoreboard} className="match-timeline-scoreboard">
            {isSwimming ? (
              <div className="match-timeline-swimming-card">
                <h2 className="match-timeline-swimming-title">
                  🏊 Natação
                </h2>
                <div className="match-timeline-swimming-subtitle">
                  {selectedMatch.category} • {selectedMatch.location.replace(/\s*\(.*?\)\s*$/, '').trim()}
                </div>
              </div>
            ) : (
              <>
                <div style={styles.teamLeft} className="match-timeline-team-column match-timeline-team-left">
                  {selectedMatch.events?.some(e => e.type === "hansoku" && e.teamId === selectedMatch.teamA.id) && (
                    <div className="match-timeline-team-disqualified">
                      DESCLASSIFICADO (HANSOKU)
                    </div>
                  )}
                  <h2
                    style={styles.teamName}
                    className={`match-timeline-team-name ${selectedMatch.events?.some(e => e.type === "hansoku" && e.teamId === selectedMatch.teamA.id) ? "match-timeline-team-name--disqualified" : ""}`}
                  >
                    {selectedMatch.teamA.name}
                    {selectedMatch.events?.some(e => e.type === "senshu" && e.teamId === selectedMatch.teamA.id) && (
                      <span title="Senshu (Primeiro Ponto)" className="match-timeline-senshu-star">⭐</span>
                    )}
                  </h2>
                  <div className="match-timeline-team-score-row">
                    <div className={`match-timeline-score ${flashTeam === "A" || flashTeam === "both" ? "match-timeline-score--active" : "match-timeline-score--team-a"}`}>{selectedMatch.scoreA}</div>
                    {isSetSport && (
                      <div className="match-timeline-set-score">
                        {(() => {
                          const lastSetWinEvent = [
                            ...(selectedMatch.events || []),
                          ]
                            .reverse()
                            .find((e) => e.type === "set_win");
                          const events = lastSetWinEvent
                            ? selectedMatch.events?.slice(
                              selectedMatch.events.indexOf(lastSetWinEvent) + 1,
                            ) || []
                            : selectedMatch.events || [];
                          return events.filter(
                            (e) =>
                              e.type === "goal" &&
                              e.teamId === selectedMatch.teamA.id,
                          ).length;
                        })()} {" "}
                        pts
                      </div>
                    )}
                  </div>
                </div>

                {!isNoTimerSport ? (
                  <div
                    style={styles.timeDisplay}
                    className="match-timeline-time-display"
                  >
                    {/* Nome da modalidade */}
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      letterSpacing: "1.5px",
                      marginBottom: "2px",
                    }}>
                      {selectedMatch.sport} {selectedMatch.category}
                    </span>
                    <Clock size={24} />
                    <span style={styles.minute}>
                      {formatClock(currentMinute)}
                    </span>
                    {isRunning && (
                      <span style={styles.liveBadge} className="pulse-animation">
                        AO VIVO
                      </span>
                    )}
                    {isBeachTennis && (
                      <span
                        style={{
                          marginTop: "4px",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Pontos:{" "}
                        {
                          BEACH_POINT_LABELS[
                          Math.min(beachScoreState.gamePointsA, 3)
                          ]
                        }{" "}
                        -{" "}
                        {
                          BEACH_POINT_LABELS[
                          Math.min(beachScoreState.gamePointsB, 3)
                          ]
                        }
                      </span>
                    )}
                    {isBeachTennis && (
                      <span
                        style={{
                          marginTop: "4px",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Sets: {beachSetsState.setsA} - {beachSetsState.setsB}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    style={styles.timeDisplay}
                    className="match-timeline-time-display"
                  >
                    {/* Nome da modalidade */}
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      letterSpacing: "1.5px",
                      marginBottom: "2px",
                    }}>
                      {selectedMatch.sport} {selectedMatch.category}
                    </span>
                    {selectedMatch.status === "live" && (
                      <span style={styles.liveBadge} className="pulse-animation">
                        AO VIVO
                      </span>
                    )}
                    {isBeachTennis ? (
                      <>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          Beach Tennis
                        </span>
                        <span
                          style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Pontos:{" "}
                          {
                            BEACH_POINT_LABELS[
                            Math.min(beachScoreState.gamePointsA, 3)
                            ]
                          }{" "}
                          -{" "}
                          {
                            BEACH_POINT_LABELS[
                            Math.min(beachScoreState.gamePointsB, 3)
                            ]
                          }
                        </span>
                        <span
                          style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Games: {selectedMatch.scoreA} - {selectedMatch.scoreB}
                        </span>
                        <span
                          style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Sets: {beachSetsState.setsA} - {beachSetsState.setsB}
                        </span>
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Sem cronômetro
                      </span>
                    )}
                  </div>
                )}

                <div style={styles.teamRight} className="match-timeline-team-column match-timeline-team-right">
                  {selectedMatch.events?.some(e => e.type === "hansoku" && e.teamId === selectedMatch.teamB.id) && (
                    <div className="match-timeline-team-disqualified">
                      DESCLASSIFICADO (HANSOKU)
                    </div>
                  )}
                  <h2
                    style={styles.teamName}
                    className={`match-timeline-team-name ${selectedMatch.events?.some(e => e.type === "hansoku" && e.teamId === selectedMatch.teamB.id) ? "match-timeline-team-name--disqualified" : ""}`}
                  >
                    {selectedMatch.teamB.name}
                    {selectedMatch.events?.some(e => e.type === "senshu" && e.teamId === selectedMatch.teamB.id) && (
                      <span title="Senshu (Primeiro Ponto)" className="match-timeline-senshu-star">⭐</span>
                    )}
                  </h2>
                  <div className="match-timeline-team-score-row">
                    <div className={`match-timeline-score ${flashTeam === "B" || flashTeam === "both" ? "match-timeline-score--active" : "match-timeline-score--team-b"}`}>{selectedMatch.scoreB}</div>
                    {isSetSport && (
                      <div className="match-timeline-set-score">
                        {(() => {
                          const lastSetWinEvent = [
                            ...(selectedMatch.events || []),
                          ]
                            .reverse()
                            .find((e) => e.type === "set_win");
                          const events = lastSetWinEvent
                            ? selectedMatch.events?.slice(
                              selectedMatch.events.indexOf(lastSetWinEvent) + 1,
                            ) || []
                            : selectedMatch.events || [];
                          return events.filter(
                            (e) =>
                              e.type === "goal" &&
                              e.teamId === selectedMatch.teamB.id,
                          ).length;
                        })()} {" "}
                        pts
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Banner de Disputa de Pênaltis — aparece ao clicar Fim de Jogo com empate */}
          {isPenaltyShootoutSport && penaltyShootoutActive && !shootoutStarted && selectedMatch && (
            <div style={{
              margin: '16px 0',
              padding: '24px',
              background: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.4)',
              borderRadius: '14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b', marginBottom: '6px' }}>
                ⚽ Empate no tempo regulamentar — {selectedMatch.scoreA} x {selectedMatch.scoreB}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {isFutebolX1
                  ? 'Cobranças alternadas em morte súbita até sair o vencedor.'
                  : 'Disputa por 3 pênaltis alternados. Persistindo o empate, cobranças alternadas até o desempate.'}
              </div>

              {/* Seleção do time que inicia */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                  Quem cobra primeiro?
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(["A", "B"] as const).map((team) => {
                    const name = getSelectedMatchTeamShortName(team);
                    const color = team === "A" ? "#3b82f6" : "#ef4444";
                    const isSelected = shootoutFirstTeam === team;
                    return (
                      <button
                        key={team}
                        onClick={() => setShootoutFirstTeam(team)}
                        style={{
                          flex: 1, padding: '12px', borderRadius: '8px', border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.15)'}`,
                          background: isSelected ? `${color}22` : 'transparent',
                          color: isSelected ? color : 'var(--text-secondary)',
                          fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                style={{
                  background: '#f59e0b', color: 'black', border: 'none',
                  borderRadius: '10px', padding: '14px 32px',
                  fontSize: '15px', fontWeight: 800, cursor: 'pointer', width: '100%',
                }}
                onClick={() => handleStartPenaltyShootout(shootoutFirstTeam)}
              >
                🥅 Iniciar Disputa de Pênaltis
              </button>
            </div>
          )}

          {/* Painel de cobranças — visível durante toda a disputa após início */}
          {isPenaltyShootoutSport && shootoutStarted && selectedMatch && selectedMatch.status !== "finished" && (
            <div style={{
              margin: '16px 0',
              padding: '20px',
              background: 'rgba(234,179,8,0.06)',
              border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: '14px',
            }}>
              <h3 style={{ ...styles.sectionTitle, color: '#f59e0b', marginBottom: '8px', textAlign: 'center' }}>
                🥅 Disputa de Pênaltis {isFutebolX1 ? <span style={{ fontSize: '12px', color: '#ef4444' }}>— MORTE SÚBITA</span> : shootoutStats.isSuddenDeath && <span style={{ fontSize: '12px', color: '#ef4444' }}>— MORTE SÚBITA</span>}
              </h3>

              {/* Indicador de vez */}
              <div style={{ textAlign: 'center', marginBottom: '14px', fontSize: '13px', fontWeight: 700, color: shootoutStats.nextTeam === "A" ? "#3b82f6" : "#ef4444" }}>
                ▶ Vez de cobrar: {getSelectedMatchTeamShortName(shootoutStats.nextTeam)}
              </div>

              {/* Placar da disputa */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '24px', marginBottom: '16px', padding: '12px',
                background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
              }}>
                {(["A", "B"] as const).map((team) => {
                  const teamObj = team === "A" ? selectedMatch.teamA : selectedMatch.teamB;
                  const scored = team === "A" ? shootoutStats.scoredA : shootoutStats.scoredB;
                  const total = team === "A" ? shootoutStats.totalA : shootoutStats.totalB;
                  const color = team === "A" ? "#3b82f6" : "#ef4444";
                  const SERIES = 3;
                  return (
                    <div key={team} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {getTeamShortName(teamObj)}
                      </div>
                      <div style={{ fontSize: '44px', fontWeight: 900, color, lineHeight: 1 }}>{scored}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {total}/{Math.max(SERIES, total)} cobranças
                      </div>
                      {/* Indicadores de cobrança */}
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '6px' }}>
                        {Array.from({ length: Math.max(SERIES, total) }).map((_, i) => {
                          const startIdx = (selectedMatch.events || []).findIndex(
                            (e) => e.type === "halftime" && e.description === "⚽ Início da Disputa de Pênaltis"
                          );
                          const teamId = team === "A" ? selectedMatch.teamA.id : selectedMatch.teamB.id;
                          const kicks = (selectedMatch.events || []).slice(startIdx + 1).filter(
                            (e) => (e.type === "penalty_scored" || e.type === "penalty_missed") && e.teamId === teamId
                          );
                          const kick = kicks[i];
                          const bg = !kick ? 'rgba(255,255,255,0.15)' : kick.type === "penalty_scored" ? '#22c55e' : '#ef4444';
                          return <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: bg }} />;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botões de cobrança — só o time da vez está ativo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {(["A", "B"] as const).map((team) => {
                  const isMyTurn = shootoutStats.nextTeam === team;
                  const color = team === "A" ? "#3b82f6" : "#ef4444";
                  const bg = team === "A" ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)";
                  const name = getSelectedMatchTeamShortName(team);
                  return (
                    <div key={team} style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: isMyTurn ? 1 : 0.35 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, textAlign: 'center', color }}>{name}</div>
                      <button
                        style={{ ...styles.eventBtn, background: bg, borderColor: color, color, fontWeight: 700 }}
                        onClick={() => handleShootoutPenalty("penalty_scored", team)}
                        disabled={!isMyTurn}
                      >
                        🎯 Pênalti Marcado
                      </button>
                      <button
                        style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn, opacity: isMyTurn ? 1 : 0.35 }}
                        onClick={() => handleShootoutPenalty("penalty_missed", team)}
                        disabled={!isMyTurn}
                      >
                        ❌ Pênalti Perdido
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controles do Jogo */}
          <div style={{ ...styles.gameControls, display: penaltyShootoutActive ? 'none' : undefined }}>
            <h3
              style={styles.sectionTitle}
              className="match-timeline-section-title"
            >
              {isSwimming ? "Classificação da Prova" : "Controle da Partida"}
            </h3>
            {isSwimming ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "10px 0",
                }}
              >
                <button
                  onClick={() => setIsRankingModalOpen(true)}
                  style={{
                    background: "var(--accent-color)",
                    color: "white",
                    padding: "16px 32px",
                    borderRadius: "12px",
                    border: "none",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  🏁 Definir Classificação da Prova
                </button>
              </div>
            ) : (
              <>
                <div
                  style={styles.controlButtons}
                  className="match-timeline-control-grid"
                >
                  {isXadrez ? (
                    <button
                      style={{
                        ...styles.controlBtn,
                        background: isRunning ? "rgba(245, 158, 11, 0.2)" : "var(--success-color, #10b981)",
                        color: isRunning ? "#f59e0b" : "white",
                        border: `1px solid ${isRunning ? "#f59e0b" : "var(--success-color, #10b981)"}`,
                        gridColumn: "1 / -1",
                        padding: "24px",
                        fontSize: "20px",
                        fontWeight: 800,
                        boxShadow: isRunning ? "none" : "0 4px 15px rgba(16, 185, 129, 0.3)"
                      }}
                      onClick={() => {
                        if (isRunning) {
                          handlePause();
                        } else {
                          if (!selectedMatch.events?.some((e) => e.type === "start")) {
                            handleStartMatch();
                          } else {
                            handleResume();
                          }
                        }
                      }}
                      disabled={selectedMatch.status === "finished"}
                    >
                      {isRunning ? <Pause size={28} /> : <Play size={28} />}
                      {isRunning ? "Pausar Relógio" : selectedMatch.events?.some((e) => e.type === "start") ? "Retomar Relógio" : "Iniciar Relógio de Xadrez"}
                    </button>
                  ) : (
                    <>
                      <button
                        style={{ ...styles.controlBtn, ...styles.startBtn }}
                        onClick={handleStartMatch}
                        disabled={
                          (isNoTimerSport
                            ? selectedMatch.status === "live"
                            : isRunning) || selectedMatch.status === "finished"
                        }
                      >
                        <Play size={20} />
                        Iniciar Jogo
                      </button>
                      {!isNoTimerSport && (
                        <button
                          style={{ ...styles.controlBtn, ...styles.pauseBtn }}
                          onClick={
                            isBasketball ? handlePause : handleHalfTime
                          }
                          disabled={!isRunning}
                        >
                          <Pause size={20} />
                          {isBasketball ? "Pausar Tempo" : "Intervalo"}
                        </button>
                      )}
                      {!isNoTimerSport && (
                        <button
                          style={{ ...styles.controlBtn, ...styles.resumeBtn }}
                          onClick={handleResume}
                          disabled={
                            isRunning ||
                            !selectedMatch.events?.some((e) => e.type === "start")
                          }
                        >
                          <Play size={20} />
                          Retomar
                        </button>
                      )}
                      <button
                        style={{
                          ...styles.controlBtn,
                          ...styles.endBtn,
                          ...(isBasketball3x3 &&
                            (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21)
                            ? {
                              boxShadow: "0 0 15px var(--danger-color)",
                              animation: "pulse 1.5s infinite",
                            }
                            : {}),
                        }}
                        onClick={handleEndMatch}
                        disabled={selectedMatch.status === "finished"}
                      >
                        <StopCircle size={20} />
                        Fim de Jogo
                      </button>
                    </>
                  )}
                </div>

                {isBasketball && !isNoTimerSport && (
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Pausas do Basquete
                    </div>
                    <div
                      style={{
                        ...styles.controlButtons,
                        gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
                      }}
                    >
                      {!isBasketball3x3 && (
                        <button
                          style={{
                            ...styles.eventBtn,
                            background: "rgba(245, 158, 11, 0.15)",
                            borderColor: "#f59e0b",
                            color: "#f59e0b",
                          }}
                          onClick={handleBasketballQuarterBreak}
                          disabled={!isRunning && currentMinute > 0}
                        >
                          Intervalo entre Quartos
                        </button>
                      )}
                      <button
                        style={{
                          ...styles.eventBtn,
                          background: "rgba(59, 130, 246, 0.15)",
                          borderColor: "#3b82f6",
                          color: "#3b82f6",
                        }}
                        onClick={() => handleBasketballTimeout("A")}
                        disabled={!isRunning}
                      >
                        Tempo {selectedMatchTeamAShortName}
                      </button>
                      <button
                        style={{
                          ...styles.eventBtn,
                          background: "rgba(239, 68, 68, 0.15)",
                          borderColor: "#ef4444",
                          color: "#ef4444",
                        }}
                        onClick={() => handleBasketballTimeout("B")}
                        disabled={!isRunning}
                      >
                        Tempo {selectedMatchTeamBShortName}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {isBeachTennis && (
            <>
              <div style={styles.eventSection}>
                <h3 style={styles.sectionTitle}>🎾 Pontuação</h3>
                {(() => {
                  const isFinal = selectedMatch.stage === "Fase Final";
                  const targetGames = isFinal ? 8 : 6;
                  const { ptsA, ptsB, isTiebreak } = getBeachCurrentGamePoints(selectedMatch);
                  const PT_LABELS = ["0", "15", "30", "40"];
                  const labelA = isTiebreak ? String(ptsA) : (PT_LABELS[Math.min(ptsA, 3)] ?? "0");
                  const labelB = isTiebreak ? String(ptsB) : (PT_LABELS[Math.min(ptsB, 3)] ?? "0");
                  const phaseColor = isFinal ? "#f59e0b" : "var(--accent-color)";
                  const phaseBg = isFinal ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
                  const phaseBorder = isFinal ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";
                  return (
                    <>
                      {/* Fase + alvo */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", marginBottom: "10px",
                        background: phaseBg, borderRadius: "8px", border: `1px solid ${phaseBorder}`,
                      }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: phaseColor, textTransform: "uppercase" }}>
                          {isFinal ? "🏆 Fase Final" : "📋 Fase de Classificação"}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                          Games: {selectedMatch.scoreA} x {selectedMatch.scoreB} · Alvo: {targetGames} (vant. 2)
                        </span>
                      </div>

                      {/* Placar do game atual */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "16px", padding: "10px", marginBottom: "12px",
                        background: "rgba(255,255,255,0.04)", borderRadius: "8px",
                        border: isTiebreak ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      }}>
                        {isTiebreak && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#eab308", textTransform: "uppercase", marginRight: "4px" }}>
                            🎾 Tie-break
                          </span>
                        )}
                        <span style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)" }}>{labelA}</span>
                        <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)" }}>–</span>
                        <span style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)" }}>{labelB}</span>
                      </div>
                    </>
                  );
                })()}

                {/* Único botão por time — sistema decide o resto */}
                <div style={styles.eventButtons} className="match-timeline-event-grid">
                  <button
                    style={{ ...styles.eventBtn, ...styles.teamABtn }}
                    onClick={() => handleBeachPoint("A")}
                  >
                    <Plus size={20} />
                    Ponto {selectedMatchTeamAShortName}
                  </button>
                  <button
                    style={{ ...styles.eventBtn, ...styles.teamBBtn }}
                    onClick={() => handleBeachPoint("B")}
                  >
                    <Plus size={20} />
                    Ponto {selectedMatchTeamBShortName}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Blocos de eventos — ocultos durante toda a disputa de pênaltis */}
          <div style={{ display: (penaltyShootoutActive) ? 'none' : undefined }}>

            {isXadrez && (
              <div style={{ ...styles.eventSection, background: "rgba(30, 30, 30, 0.4)", padding: "24px", borderRadius: "16px", border: "1px solid #333" }}>
                <h3 style={{ ...styles.sectionTitle, color: "var(--text-primary)", fontSize: "20px", marginBottom: "20px" }}>
                  ♟️ Resultado Final
                </h3>

                {!chessWinner ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <button
                      style={{
                        ...styles.eventBtn,
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: "#666",
                        color: "white",
                        padding: "24px",
                        fontWeight: 800,
                        fontSize: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onClick={() => setChessWinner("A")}
                    >
                      <Trophy size={24} color="#aaa" />
                      Vitória
                      <span style={{ fontSize: "14px", color: "#aaa" }}>{selectedMatchTeamAShortName}</span>
                    </button>

                    <button
                      style={{
                        ...styles.eventBtn,
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: "#666",
                        color: "white",
                        padding: "24px",
                        fontWeight: 800,
                        fontSize: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onClick={() => setChessWinner("B")}
                    >
                      <Trophy size={24} color="#aaa" />
                      Vitória
                      <span style={{ fontSize: "14px", color: "#aaa" }}>{selectedMatchTeamBShortName}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                      Selecione o motivo da Vitória de {chessWinner === "A" ? selectedMatchTeamAShortName : selectedMatchTeamBShortName}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                      {chessWinner !== "Draw" ? (
                        ["Xeque-mate", "Tempo Esgotado", "Abandono", "Falta (W.O.)"].map(reason => (
                          <button
                            key={reason}
                            style={{
                              padding: "12px 20px",
                              borderRadius: "8px",
                              background: chessReason === reason ? "var(--bg-hover)" : "rgba(0,0,0,0.2)",
                              border: `1px solid ${chessReason === reason ? "#fff" : "#444"}`,
                              color: "white",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            onClick={() => setChessReason(reason)}
                          >
                            {reason}
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: "12px", color: "#aaa" }}>Motivo: Acordo Mútuo / Afogado</div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button
                        style={{ ...styles.controlBtn, background: "rgba(255,255,255,0.1)", flex: 1 }}
                        onClick={() => { setChessWinner(null); setChessReason(""); }}
                      >
                        Cancelar
                      </button>
                      <button
                        style={{ ...styles.controlBtn, background: "white", color: "black", flex: 2 }}
                        disabled={!chessReason}
                        onClick={() => {
                          if (chessWinner === "A" || chessWinner === "B" || chessWinner === "Draw") {
                            handleChessResult(chessWinner, chessReason);
                          }
                        }}
                      >
                        Confirmar {chessWinner === "Draw" ? "Empate" : "Vitória"} e Encerrar
                      </button>
                    </div>
                  </div>
                )}

                {!isBeachTennis && !isBasketball && !isSwimming && !isKarate && !isJudo && !isXadrez && !isTamboreu && (
                  <div style={styles.eventSection}>
                    <h3 style={styles.sectionTitle}>
                      {isSetSport
                        ? isVolleyball
                          ? "🏐 Pontos"
                          : "🏓 Pontos"
                        : "⚽ Gols"}
                    </h3>
                    {isSetSport && isVolleyball && (() => {
                      const stage = selectedMatch.stage || "Fase de Classificação";
                      const isFinal = stage === "Fase Final";
                      const currentSet = selectedMatch.scoreA + selectedMatch.scoreB + 1;
                      const sport = selectedMatch.sport;
                      let targetPts: number;
                      if (sport === "Vôlei") {
                        targetPts = isFinal ? (currentSet <= 2 ? 25 : 15) : 25;
                      } else if (sport === "Vôlei de Praia") {
                        targetPts = isFinal ? (currentSet <= 2 ? 18 : 15) : 21;
                      } else {
                        // Futevôlei
                        targetPts = isFinal ? (currentSet <= 2 ? 18 : 15) : 18;
                      }
                      return (
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 12px", marginBottom: "10px",
                          background: isFinal ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                          borderRadius: "8px",
                          border: `1px solid ${isFinal ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: isFinal ? "#f59e0b" : "var(--accent-color)", textTransform: "uppercase" }}>
                            {isFinal ? "🏆 Fase Final" : "📋 Fase de Classificação"}
                            {isFinal && ` · Set ${currentSet}/3`}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                            Alvo: {targetPts} pts{isFinal ? " (vant. 2)" : ""}
                          </span>
                        </div>
                      );
                    })()}
                    <div
                      style={styles.eventButtons}
                      className="match-timeline-event-grid"
                    >
                      <button
                        style={{ ...styles.eventBtn, ...styles.teamABtn }}
                        onClick={() =>
                          isSetSport ? handleVolleyPoint("A") : handleGoal("A")
                        }
                      >
                        <Plus size={20} />
                        {isSetSport ? "Ponto" : "Gol"}{" "}
                        {selectedMatchTeamAShortName}
                      </button>
                      <button
                        style={{ ...styles.eventBtn, ...styles.teamBBtn }}
                        onClick={() =>
                          isSetSport ? handleVolleyPoint("B") : handleGoal("B")
                        }
                      >
                        <Plus size={20} />
                        {isSetSport ? "Ponto" : "Gol"}{" "}
                        {selectedMatchTeamBShortName}
                      </button>
                    </div>
                  </div>
                )}

                {isVolleyballAceSport && selectedMatch && selectedMatch.status !== "finished" && (
                  <div style={styles.eventSection}>
                    <h3 style={styles.sectionTitle}>🏐 Ações de Atletas (ACE / ERRO)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      {(["A", "B"] as const).map((team) => {
                        const teamObj = team === "A" ? selectedMatch.teamA : selectedMatch.teamB;
                        const availableAthletes = athletes.filter((a) =>
                          athleteMatchesTeamAndMatch(a, teamObj, selectedMatch),
                        );

                        return (
                          <div key={team} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, textAlign: "center", marginBottom: "4px", color: "white", background: team === "A" ? "rgba(59, 130, 246, 0.2)" : "rgba(239, 68, 68, 0.2)", padding: "4px", borderRadius: "4px" }}>
                              {getTeamShortName(teamObj)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {availableAthletes.map((athlete) => {
                                const playerName = `${athlete.firstName} ${athlete.lastName}`;
                                const isAceFeedback = _volleyActionFeedback?.playerId === athlete.id && _volleyActionFeedback.type === "ace";
                                const isErroFeedback = _volleyActionFeedback?.playerId === athlete.id && _volleyActionFeedback.type === "erro";

                                return (
                                  <div
                                    key={athlete.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '8px 10px',
                                      background: 'rgba(255,255,255,0.03)',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                  >
                                    <span style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                      {athlete.firstName}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <button
                                        className="volley-ace-btn"
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '11px',
                                          fontWeight: 800,
                                          borderRadius: '4px',
                                          border: '1px solid #22c55e',
                                          background: isAceFeedback ? '#22c55e' : 'rgba(34, 197, 94, 0.15)',
                                          color: isAceFeedback ? 'white' : '#22c55e',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          animation: isAceFeedback ? 'volley-btn-glow 0.5s' : 'none'
                                        }}
                                        onClick={() => _handleVolleyAce(team, playerName, athlete.id)}
                                      >
                                        ACE
                                      </button>
                                      <button
                                        className="volley-erro-btn"
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '11px',
                                          fontWeight: 800,
                                          borderRadius: '4px',
                                          border: '1px solid #ef4444',
                                          background: isErroFeedback ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                                          color: isErroFeedback ? 'white' : '#ef4444',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          animation: isErroFeedback ? 'volley-btn-glow 0.5s' : 'none'
                                        }}
                                        onClick={() => _handleVolleyErro(team, playerName, athlete.id)}
                                      >
                                        ERRO
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              {availableAthletes.length === 0 && (
                                <div style={{ fontSize: "11px", color: "#666", textAlign: "center", fontStyle: "italic" }}>
                                  Sem atletas
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isSetSport && (
                  <div style={styles.eventSection}>
                    <h3 style={styles.sectionTitle}>🏆 Sets</h3>
                    <div
                      style={styles.eventButtons}
                      className="match-timeline-event-grid"
                    >
                      <button
                        style={{
                          ...styles.eventBtn,
                          background: "var(--accent-color)",
                          borderColor: "var(--accent-color)",
                        }}
                        onClick={() => handleSetWin("A")}
                      >
                        <Trophy size={18} style={{ marginRight: "8px" }} />
                        Set Ganho {selectedMatchTeamAShortName}
                      </button>
                      <button
                        style={{
                          ...styles.eventBtn,
                          background: "var(--accent-color)",
                          borderColor: "var(--accent-color)",
                        }}
                        onClick={() => handleSetWin("B")}
                      >
                        <Trophy size={18} style={{ marginRight: "8px" }} />
                        Set Ganho {selectedMatchTeamBShortName}
                      </button>
                    </div>
                  </div>
                )}

                {isTamboreu && (
                  <div style={styles.eventSection}>
                    {/* Modal Fim de Jogo Tamboréu */}
                    {tamboreauMatchWinner && (
                      <div
                        style={{
                          position: "fixed",
                          inset: 0,
                          background: "rgba(0,0,0,0.85)",
                          zIndex: 9999,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            background: "#18181b",
                            border: "2px solid #22c55e",
                            borderRadius: "20px",
                            padding: "40px 48px",
                            textAlign: "center",
                            maxWidth: "420px",
                            width: "90%",
                            boxShadow: "0 0 60px rgba(34,197,94,0.3)",
                          }}
                        >
                          <div style={{ fontSize: "56px", marginBottom: "12px" }}>🏆</div>
                          <div style={{ fontSize: "13px", color: "#22c55e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>
                            Fim de Jogo · Tamboréu
                          </div>
                          <div style={{ fontSize: "26px", fontWeight: 900, color: "white", marginBottom: "8px" }}>
                            {tamboreauMatchWinner.name}
                          </div>
                          <div style={{ fontSize: "15px", color: "var(--text-secondary)", marginBottom: "28px" }}>
                            venceu por <span style={{ color: "white", fontWeight: 700 }}>{tamboreauMatchWinner.setsA} x {tamboreauMatchWinner.setsB}</span> sets
                          </div>
                          <button
                            style={{
                              background: "#22c55e",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              padding: "14px 32px",
                              fontSize: "15px",
                              fontWeight: 700,
                              cursor: "pointer",
                              width: "100%",
                            }}
                            onClick={() => {
                              setTamboreauMatchWinner(null);
                              navigate("/");
                            }}
                          >
                            Ver Resultados
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pontos do Set Atual */}
                    <h3 style={{ ...styles.sectionTitle, marginBottom: "12px" }}>
                      🎾 Pontos do Set Atual
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "24px",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ fontSize: "52px", fontWeight: 900, color: "#3b82f6", minWidth: "60px", textAlign: "center" }}>
                        {tamboreauPointsA}
                      </div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-secondary)" }}>x</div>
                      <div style={{ fontSize: "52px", fontWeight: 900, color: "#ef4444", minWidth: "60px", textAlign: "center" }}>
                        {tamboreauPointsB}
                      </div>
                    </div>

                    {/* Botões de ponto */}
                    <div
                      style={styles.eventButtons}
                      className="match-timeline-event-grid"
                    >
                      <button
                        style={{
                          ...styles.eventBtn,
                          background: "#1d4ed8",
                          borderColor: "#3b82f6",
                          color: "white",
                          fontSize: "16px",
                          fontWeight: 700,
                          padding: "20px",
                        }}
                        onClick={() => handleTamboreauPoint("A")}
                        disabled={selectedMatch.status === "finished"}
                      >
                        <Plus size={22} />
                        Ponto {selectedMatchTeamAShortName}
                      </button>
                      <button
                        style={{
                          ...styles.eventBtn,
                          background: "#b91c1c",
                          borderColor: "#ef4444",
                          color: "white",
                          fontSize: "16px",
                          fontWeight: 700,
                          padding: "20px",
                        }}
                        onClick={() => handleTamboreauPoint("B")}
                        disabled={selectedMatch.status === "finished"}
                      >
                        <Plus size={22} />
                        Ponto {selectedMatchTeamBShortName}
                      </button>
                    </div>

                    {/* Indicador de regra */}
                    <div style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      Set fecha em 10 pts (vantagem de 2) · Máximo 12 pts · Melhor de 3 sets
                    </div>

                    {/* Cronologia da Partida */}
                    {(selectedMatch.events || []).filter((e) =>
                      e.type === "start" || e.type === "set_win" || e.type === "end"
                    ).length > 0 && (
                        <div style={{ marginTop: "24px" }}>
                          <h3 style={{ ...styles.sectionTitle, marginBottom: "12px" }}>
                            📋 Cronologia da Partida
                          </h3>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              maxHeight: "260px",
                              overflowY: "auto",
                              padding: "4px 2px",
                            }}
                          >
                            {[...(selectedMatch.events || [])]
                              .filter((e) => e.type === "start" || e.type === "set_win" || e.type === "end")
                              .sort((a, b) => {
                                const tsA = parseInt(a.id.split("_")[1] || "0", 10);
                                const tsB = parseInt(b.id.split("_")[1] || "0", 10);
                                return tsA - tsB;
                              })
                              .map((event) => {
                                const isSetWin = event.type === "set_win";
                                const isEnd = event.type === "end";
                                const isStart = event.type === "start";
                                const color = isEnd ? "#22c55e" : isSetWin ? "#f59e0b" : "var(--text-secondary)";
                                const icon = isEnd ? "🏁" : isSetWin ? "🏆" : "▶️";
                                return (
                                  <div
                                    key={event.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: "10px",
                                      padding: "10px 14px",
                                      background: isEnd
                                        ? "rgba(34,197,94,0.08)"
                                        : isSetWin
                                          ? "rgba(245,158,11,0.08)"
                                          : "rgba(255,255,255,0.04)",
                                      borderRadius: "8px",
                                      borderLeft: `3px solid ${color}`,
                                    }}
                                  >
                                    <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
                                    <span style={{ fontSize: "13px", color, fontWeight: isStart ? 400 : 600, lineHeight: 1.4 }}>
                                      {event.description || (isStart ? "Início" : event.type)}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {isBasketball && (
                  <div style={styles.eventSection}>
                    <h3 style={{ ...styles.sectionTitle, color: "var(--accent-color)" }}>
                      🏀 Pontuação
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "15px" }}>
                      {(["A", "B"] as const).map((team) => {
                        const teamObj = team === "A" ? selectedMatch.teamA : selectedMatch.teamB;
                        const teamColor = team === "A" ? "#3b82f6" : "#ef4444";
                        const teamBg = team === "A" ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)";
                        const isDisabled = isBasketball3x3 && (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21);
                        return (
                          <div key={team} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {getTeamShortName(teamObj)}
                            </div>
                            <button style={{ ...styles.eventBtn, background: teamBg, borderColor: teamColor, color: teamColor }}
                              onClick={() => handleBasketballPoint(team, 1)} disabled={isDisabled}>
                              +1 {isBasketball3x3 ? "(Dentro da linha)" : "(Lance Livre)"}
                            </button>
                            <button style={{ ...styles.eventBtn, background: teamBg, borderColor: teamColor, color: teamColor }}
                              onClick={() => handleBasketballPoint(team, 2)} disabled={isDisabled}>
                              +2 {isBasketball3x3 ? "(Fora da linha)" : "(Quadra)"}
                            </button>
                            {!isBasketball3x3 && (
                              <button style={{ ...styles.eventBtn, background: teamBg, borderColor: teamColor, color: teamColor }}
                                onClick={() => handleBasketballPoint(team, 3)}>
                                +3 (Fora)
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isKarate && (
                  <div style={styles.eventSection}>
                    <h3
                      style={{ ...styles.sectionTitle, color: "var(--accent-color)", marginBottom: "8px" }}
                    >
                      🥋 Pontuação WKF
                    </h3>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "16px", textAlign: "center", fontStyle: "italic", lineHeight: "1.5", background: "rgba(255,255,255,0.03)", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      Na Modalidade Caratê o atleta vencedor é decidido caso algum atleta faça 8 pontos de vantagem ou tenha marcado mais pontos ao fim do tempo.
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "15px",
                      }}
                    >
                      {[
                        { teamKey: "A", teamName: selectedMatchTeamAShortName },
                        { teamKey: "B", teamName: selectedMatchTeamBShortName }
                      ].map(({ teamKey, teamName }) => (
                        <div
                          key={teamKey}
                          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              textAlign: "center",
                              marginBottom: "4px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px"
                            }}
                          >
                            {teamName}
                          </div>
                          <button
                            style={{
                              ...styles.eventBtn,
                              background: "rgba(100, 116, 139, 0.15)",
                              borderColor: "#64748b",
                              color: "#64748b",
                            }}
                            onClick={() => handleKaratePoint(teamKey as "A" | "B", 1, "Yuko")}
                          >
                            Yuko (+1)
                          </button>
                          <button
                            style={{
                              ...styles.eventBtn,
                              background: "rgba(234, 179, 8, 0.15)",
                              borderColor: "#eab308",
                              color: "#eab308",
                            }}
                            onClick={() => handleKaratePoint(teamKey as "A" | "B", 2, "Waza-ari")}
                          >
                            Waza-ari (+2)
                          </button>
                          <button
                            style={{
                              ...styles.eventBtn,
                              background: "rgba(239, 68, 68, 0.15)",
                              borderColor: "#ef4444",
                              color: "#ef4444",
                            }}
                            onClick={() => handleKaratePoint(teamKey as "A" | "B", 3, "Ippon")}
                          >
                            Ippon (+3)
                          </button>
                          <button
                            style={{
                              ...styles.eventBtn,
                              background: "rgba(251, 191, 36, 0.15)",
                              borderColor: "#f59e0b",
                              color: "#f59e0b",
                              marginTop: "8px"
                            }}
                            onClick={() => handleSenshu(teamKey as "A" | "B")}
                          >
                            Senshu (Vantagem)
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isKarate && (
                  <div style={styles.eventSection}>
                    <h3 style={{ ...styles.sectionTitle, color: "var(--danger-color, #ef4444)" }}>
                      ⚠️ Penalidades (Chui)
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "15px",
                      }}
                    >
                      {[
                        { teamKey: "A", teamName: selectedMatchTeamAShortName, teamId: selectedMatch.teamA.id },
                        { teamKey: "B", teamName: selectedMatchTeamBShortName, teamId: selectedMatch.teamB.id }
                      ].map(({ teamKey, teamName, teamId }) => {
                        const isHansoku = selectedMatch.events?.some(e => e.type === "hansoku" && e.teamId === teamId);
                        const chuiCount = selectedMatch.events?.filter(e => e.type === "chui" && e.teamId === teamId).length || 0;

                        let btnLabel = "Adicionar Penalidade";
                        if (isHansoku) btnLabel = "Hansoku (Desclassificado)";
                        else if (chuiCount > 0) btnLabel = `Chui ${chuiCount} - Próx: ${chuiCount === 3 ? "Hansoku" : `Chui ${chuiCount + 1}`}`;

                        return (
                          <button
                            key={teamKey}
                            style={{
                              ...styles.eventBtn,
                              background: isHansoku ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.15)",
                              borderColor: "var(--danger-color, #ef4444)",
                              color: isHansoku ? "white" : "#ef4444",
                              padding: "16px",
                              fontSize: "14px",
                              fontWeight: 800,
                              opacity: isHansoku ? 0.7 : 1,
                              cursor: isHansoku ? "not-allowed" : "pointer"
                            }}
                            onClick={() => handleKaratePenalty(teamKey as "A" | "B")}
                            disabled={isHansoku || selectedMatch.status === "finished"}
                          >
                            {btnLabel} ({teamName})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isKarate && currentMinute === 0 && !isRunning && selectedMatch.status !== "finished" && selectedMatch.scoreA === selectedMatch.scoreB && (
                  <div style={styles.eventSection}>
                    <h3 style={{ ...styles.sectionTitle, color: "var(--accent-color)" }}>
                      ⚖️ Decisão de Hantei (Empate)
                    </h3>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        style={{ ...styles.eventBtn, background: "rgba(59, 130, 246, 0.15)", borderColor: "#3b82f6", color: "#3b82f6" }}
                        onClick={() => handleHantei("A")}
                      >
                        Hantei para {selectedMatchTeamAShortName}
                      </button>
                      <button
                        style={{ ...styles.eventBtn, background: "rgba(239, 68, 68, 0.15)", borderColor: "#ef4444", color: "#ef4444" }}
                        onClick={() => handleHantei("B")}
                      >
                        Hantei para {selectedMatchTeamBShortName}
                      </button>
                    </div>
                  </div>
                )}

                {isJudo && (
                  <div style={styles.eventSection}>
                    <h3
                      style={{ ...styles.sectionTitle, color: isGoldenScore ? "var(--warning-color, #f59e0b)" : "var(--accent-color)" }}
                    >
                      🥋 Pontuação Judô {isGoldenScore && " (GOLDEN SCORE)"}
                    </h3>

                    {/* Painel de regras */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginBottom: "14px",
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#22c55e", whiteSpace: "nowrap" }}>IPPON (2 pts)</span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>Vitória direta. Encerra a luta.</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#eab308", whiteSpace: "nowrap" }}>WAZA-ARI (1 pt)</span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>Ponto técnico. 2 = Ippon.</span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "15px",
                      }}
                    >
                      {[
                        { teamKey: "A", teamName: selectedMatchTeamAShortName },
                        { teamKey: "B", teamName: selectedMatchTeamBShortName }
                      ].map(({ teamKey, teamName }) => (
                        <div
                          key={teamKey}
                          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              textAlign: "center",
                              marginBottom: "4px",
                            }}
                          >
                            {teamName}
                          </div>
                          <button
                            style={{
                              ...styles.eventBtn,
                              background: "rgba(234, 179, 8, 0.15)",
                              borderColor: "#eab308",
                              color: "#eab308",
                            }}
                            onClick={() => handleJudoPoint(teamKey as "A" | "B", "waza_ari")}
                            disabled={selectedMatch.status === "finished"}
                          >
                            Waza-ari (+1)
                          </button>
                          <button
                            style={{
                              ...styles.eventBtn,
                              background: "rgba(34, 197, 94, 0.15)",
                              borderColor: "#22c55e",
                              color: "#22c55e",
                            }}
                            onClick={() => handleJudoPoint(teamKey as "A" | "B", "ippon")}
                            disabled={selectedMatch.status === "finished"}
                          >
                            Ippon (Vitória)
                          </button>
                          <button
                            style={{
                              ...styles.eventBtn,
                              background: osaekomiTeam === teamKey ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.15)",
                              borderColor: "#3b82f6",
                              color: osaekomiTeam === teamKey ? "white" : "#3b82f6",
                              marginTop: "8px",
                              opacity: (osaekomiTeam && osaekomiTeam !== teamKey) ? 0.5 : 1,
                            }}
                            onClick={() => osaekomiTeam === teamKey ? handleToketa() : handleOsaekomi(teamKey as "A" | "B")}
                            disabled={selectedMatch.status === "finished" || !!(osaekomiTeam && osaekomiTeam !== teamKey)}
                          >
                            {osaekomiTeam === teamKey ? "Toketa (Sair)" : "Finalização"}
                          </button>
                        </div>
                      ))}
                    </div>

                    {osaekomiTeam && (
                      <div style={{
                        marginTop: "20px",
                        padding: "15px",
                        background: "rgba(59, 130, 246, 0.1)",
                        borderRadius: "12px",
                        border: "2px solid #3b82f6",
                        textAlign: "center",
                        animation: "pulse 2s infinite"
                      }}>
                        <div style={{ color: "#3b82f6", fontWeight: 800, fontSize: "14px", textTransform: "uppercase", marginBottom: "5px" }}>
                          ⏲️ Finalização em Curso ({osaekomiTeam === "A" ? selectedMatchTeamAShortName : selectedMatchTeamBShortName})
                        </div>
                        <div style={{ fontSize: "36px", fontWeight: 900, color: "#3b82f6" }}>
                          {osaekomiSeconds}s
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "5px" }}>
                          10s = Waza-ari | 20s = Ippon
                        </div>
                      </div>
                    )}

                    <h3 style={{ ...styles.sectionTitle, color: "var(--danger-color, #ef4444)", marginTop: "20px" }}>
                      ⚠️ Penalidades (Shido)
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "15px",
                      }}
                    >
                      {[
                        { teamKey: "A", teamName: selectedMatchTeamAShortName, teamId: selectedMatch.teamA.id },
                        { teamKey: "B", teamName: selectedMatchTeamBShortName, teamId: selectedMatch.teamB.id }
                      ].map(({ teamKey, teamName, teamId }) => {
                        const isHansokuMake = selectedMatch.events?.some(e => e.type === "hansoku_make" && e.teamId === teamId);
                        const shidoCount = selectedMatch.events?.filter(e => e.type === "shido" && e.teamId === teamId).length || 0;

                        let btnLabel = "Adicionar Shido";
                        if (isHansokuMake) btnLabel = "Hansoku-make (Desclassificado)";
                        else if (shidoCount > 0) btnLabel = `Shido ${shidoCount} - Próx: ${shidoCount === 2 ? "Hansoku-make" : `Shido ${shidoCount + 1}`}`;

                        return (
                          <button
                            key={teamKey}
                            style={{
                              ...styles.eventBtn,
                              background: isHansokuMake ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.15)",
                              borderColor: "var(--danger-color, #ef4444)",
                              color: isHansokuMake ? "white" : "#ef4444",
                              padding: "16px",
                              fontSize: "14px",
                              fontWeight: 800,
                              opacity: isHansokuMake ? 0.7 : 1,
                              cursor: isHansokuMake ? "not-allowed" : "pointer"
                            }}
                            onClick={() => handleJudoShido(teamKey as "A" | "B")}
                            disabled={isHansokuMake || selectedMatch.status === "finished"}
                          >
                            {btnLabel} ({teamName})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isBeachTennis && !isSetSport && !isBasketball && !isSwimming && !isKarate && !isJudo && !isXadrez && !isTamboreu && (
                  <>
                    <div style={{
                      ...styles.eventSection,
                      ...(pendingShootout ? { opacity: 0.35, pointerEvents: 'none' } : {}),
                    }}>
                      <h3 style={styles.sectionTitle}>🟨 Cartões Amarelos</h3>
                      <div style={styles.eventButtons} className="match-timeline-event-grid">
                        <button
                          style={{ ...styles.eventBtn, ...styles.yellowBtn }}
                          onClick={() => handleCard("yellow_card", "A")}
                        >
                          🟨 {selectedMatchTeamAShortName}
                        </button>
                        <button
                          style={{ ...styles.eventBtn, ...styles.yellowBtn }}
                          onClick={() => handleCard("yellow_card", "B")}
                        >
                          🟨 {selectedMatchTeamBShortName}
                        </button>
                      </div>
                    </div>

                    <div style={{
                      ...styles.eventSection,
                      ...(pendingShootout ? { opacity: 0.35, pointerEvents: 'none' } : {}),
                    }}>
                      <h3 style={styles.sectionTitle}>🟥 Cartões Vermelhos</h3>
                      <div
                        style={styles.eventButtons}
                        className="match-timeline-event-grid"
                      >
                        <button
                          style={{ ...styles.eventBtn, ...styles.redBtn }}
                          onClick={() => handleCard("red_card", "A")}
                        >
                          🟥 {selectedMatchTeamAShortName}
                        </button>
                        <button
                          style={{ ...styles.eventBtn, ...styles.redBtn }}
                          onClick={() => handleCard("red_card", "B")}
                        >
                          🟥 {selectedMatchTeamBShortName}
                        </button>
                      </div>
                    </div>

                    {isFutebolX1 && (
                      <div style={{
                        ...styles.eventSection,
                        ...(pendingShootout ? {
                          border: '2px solid #f59e0b',
                          borderRadius: '10px',
                          padding: '12px',
                          background: 'rgba(245,158,11,0.06)',
                        } : {}),
                      }}>
                        <h3 style={styles.sectionTitle}>🥅 Shoot-out</h3>

                        {/* Banner de alerta quando há shoot-out pendente */}
                        {pendingShootout && (
                          <div style={{
                            background: 'rgba(245,158,11,0.15)',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            ⚠️ {pendingShootout.reason}
                          </div>
                        )}

                        <div style={styles.eventButtons} className="match-timeline-event-grid">
                          <button
                            style={{
                              ...styles.eventBtn, ...styles.penaltyBtn,
                              ...(pendingShootout && pendingShootout.team !== "A" ? { opacity: 0.25, cursor: 'not-allowed' } : {}),
                              ...(pendingShootout && pendingShootout.team === "A" ? { boxShadow: '0 0 0 2px #f59e0b' } : {}),
                            }}
                            onClick={() => handleShootout("shootout_scored", "A")}
                            disabled={!!pendingShootout && pendingShootout.team !== "A"}
                          >
                            🎯 Shoot-out Marcado{" "}{selectedMatchTeamAShortName}
                          </button>
                          <button
                            style={{
                              ...styles.eventBtn, ...styles.penaltyBtn,
                              ...(pendingShootout && pendingShootout.team !== "B" ? { opacity: 0.25, cursor: 'not-allowed' } : {}),
                              ...(pendingShootout && pendingShootout.team === "B" ? { boxShadow: '0 0 0 2px #f59e0b' } : {}),
                            }}
                            onClick={() => handleShootout("shootout_scored", "B")}
                            disabled={!!pendingShootout && pendingShootout.team !== "B"}
                          >
                            🎯 Shoot-out Marcado{" "}{selectedMatchTeamBShortName}
                          </button>
                        </div>
                        <div style={{ ...styles.eventButtons, marginTop: "12px" }} className="match-timeline-event-grid">
                          <button
                            style={{
                              ...styles.eventBtn, ...styles.penaltyMissedBtn,
                              ...(pendingShootout && pendingShootout.team !== "A" ? { opacity: 0.25, cursor: 'not-allowed' } : {}),
                              ...(pendingShootout && pendingShootout.team === "A" ? { boxShadow: '0 0 0 2px #f59e0b' } : {}),
                            }}
                            onClick={() => handleShootout("shootout_missed", "A")}
                            disabled={!!pendingShootout && pendingShootout.team !== "A"}
                          >
                            ❌ Shoot-out Perdido{" "}{selectedMatchTeamAShortName}
                          </button>
                          <button
                            style={{
                              ...styles.eventBtn, ...styles.penaltyMissedBtn,
                              ...(pendingShootout && pendingShootout.team !== "B" ? { opacity: 0.25, cursor: 'not-allowed' } : {}),
                              ...(pendingShootout && pendingShootout.team === "B" ? { boxShadow: '0 0 0 2px #f59e0b' } : {}),
                            }}
                            onClick={() => handleShootout("shootout_missed", "B")}
                            disabled={!!pendingShootout && pendingShootout.team !== "B"}
                          >
                            ❌ Shoot-out Perdido{" "}{selectedMatchTeamBShortName}
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={styles.eventSection}>
                      <h3 style={styles.sectionTitle}>
                        🎯 {isHandebol ? "TIRO DE 7 METROS" : "Pênaltis"}
                      </h3>
                      <div
                        style={styles.eventButtons}
                        className="match-timeline-event-grid"
                      >
                        <button
                          style={{ ...styles.eventBtn, ...styles.penaltyBtn }}
                          onClick={() => handlePenalty("penalty_scored", "A")}
                        >
                          🎯 {isHandebol ? "TIRO DE 7 METROS" : "Pênalti"} Marcado{" "}
                          {selectedMatchTeamAShortName}
                        </button>
                        <button
                          style={{ ...styles.eventBtn, ...styles.penaltyBtn }}
                          onClick={() => handlePenalty("penalty_scored", "B")}
                        >
                          🎯 {isHandebol ? "TIRO DE 7 METROS" : "Pênalti"} Marcado{" "}
                          {selectedMatchTeamBShortName}
                        </button>
                      </div>
                      <div
                        style={{ ...styles.eventButtons, marginTop: "12px" }}
                        className="match-timeline-event-grid"
                      >
                        <button
                          style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                          onClick={() => handlePenalty("penalty_missed", "A")}
                        >
                          ❌ {isHandebol ? "TIRO DE 7 METROS" : "Pênalti"} Perdido{" "}
                          {selectedMatchTeamAShortName}
                        </button>
                        <button
                          style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                          onClick={() => handlePenalty("penalty_missed", "B")}
                        >
                          ❌ {isHandebol ? "TIRO DE 7 METROS" : "Pênalti"} Perdido{" "}
                          {selectedMatchTeamBShortName}
                        </button>
                      </div>
                    </div>

                    {/* Painel de cobranças da disputa de pênaltis */}
                    {isPenaltyShootoutSport && shootoutStarted && selectedMatch.status !== "finished" && (
                      <div style={{ ...styles.eventSection, background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "12px" }}>
                        <h3 style={{ ...styles.sectionTitle, color: "#f59e0b", marginBottom: "12px" }}>
                          🥅 Disputa de Pênaltis
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "16px", padding: "12px", background: "rgba(0,0,0,0.3)", borderRadius: "10px" }}>
                          {(["A", "B"] as const).map((team) => {
                            const teamObj = team === "A" ? selectedMatch.teamA : selectedMatch.teamB;
                            const scored = team === "A" ? shootoutStats.scoredA : shootoutStats.scoredB;
                            const total = team === "A" ? shootoutStats.totalA : shootoutStats.totalB;
                            const color = team === "A" ? "#3b82f6" : "#ef4444";
                            return (
                              <div key={team} style={{ textAlign: "center", flex: 1 }}>
                                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>{getTeamShortName(teamObj)}</div>
                                <div style={{ fontSize: "40px", fontWeight: 900, color }}>{scored}</div>
                                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{total} cobranças</div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          {(["A", "B"] as const).map((team) => {
                            const color = team === "A" ? "#3b82f6" : "#ef4444";
                            const bg = team === "A" ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)";
                            const name = getSelectedMatchTeamShortName(team);
                            return (
                              <div key={team} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ fontSize: "12px", fontWeight: 700, textAlign: "center", color }}>{name}</div>
                                <button style={{ ...styles.eventBtn, background: bg, borderColor: color, color, fontWeight: 700 }}
                                  onClick={() => handleShootoutPenalty("penalty_scored", team)}>
                                  🎯 Pênalti Marcado
                                </button>
                                <button style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                                  onClick={() => handleShootoutPenalty("penalty_missed", team)}>
                                  ❌ Pênalti Perdido
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Modal de Confirmação de Reset */}
                {showResetConfirm && (
                  <div style={styles.modal}>
                    <div style={styles.modalContent}>
                      <h3 style={styles.modalTitle}>⚠️ Confirmar Reset</h3>
                      <p
                        style={{
                          textAlign: "center",
                          marginBottom: "20px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Tem certeza que deseja resetar esta partida?
                        <br />
                        Todos os eventos e placar serão apagados.
                      </p>
                      <div style={styles.modalButtons}>
                        <button
                          style={{ ...styles.modalBtn, ...styles.confirmBtn }}
                          onClick={handleResetMatch}
                        >
                          Sim, Resetar
                        </button>
                        <button
                          style={{ ...styles.modalBtn, ...styles.cancelBtn }}
                          onClick={() => setShowResetConfirm(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal de Classificação de Natação */}
                {isRankingModalOpen && selectedMatch && (
                  <div style={styles.modal}>
                    <div
                      style={{
                        ...styles.modalContentLarge,
                        maxWidth: "900px",
                        width: "95%",
                        maxHeight: "90vh",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <h3 style={styles.modalTitle}>🏁 Classificação da Prova</h3>
                      <div style={{ ...styles.modalSubtitle, marginBottom: "20px" }}>
                        Preencha o atleta de cada equipe, a posição e o tempo
                      </div>

                      <div
                        style={{
                          overflowY: "auto",
                          padding: "10px",
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "12px",
                          flex: 1,
                        }}
                        className="custom-scrollbar"
                      >
                        {swimmingEntries.length === 0 && (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "20px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Nenhuma equipe encontrada para esta prova.
                          </div>
                        )}
                        {swimmingEntries.map((entry) => (
                          <div
                            key={entry.id}
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              padding: "12px",
                              borderRadius: "10px",
                              border: "1px solid var(--border-color)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              {entry.participant.logo && (
                                <img
                                  src={entry.participant.logo}
                                  alt=""
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    objectFit: "contain",
                                  }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 700 }}>
                                  {entry.participant.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {entry.participant.faculty}
                                </div>
                              </div>
                              <select
                                value={swimmingRankings[entry.id] || ""}
                                disabled={hasSwimmingTime(swimmingTimes[entry.id] || "")}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSwimmingRankings((prev) => {
                                    if (!value) {
                                      const { [entry.id]: _removed, ...rest } = prev; // eslint-disable-line @typescript-eslint/no-unused-vars
                                      return rest;
                                    }
                                    return { ...prev, [entry.id]: parseInt(value, 10) };
                                  });
                                }}
                                style={{
                                  background: "#222",
                                  color: "white",
                                  border: "1px solid #444",
                                  borderRadius: "6px",
                                  padding: "5px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  opacity: hasSwimmingTime(swimmingTimes[entry.id] || "") ? 0.6 : 1,
                                  cursor: hasSwimmingTime(swimmingTimes[entry.id] || "") ? "not-allowed" : "pointer"
                                }}
                              >
                                <option value="">Posição</option>
                                {Array.from(
                                  { length: maxSwimmingRank },
                                  (_, i) => i + 1,
                                ).map((n) => (
                                  <option key={n} value={n}>
                                    {n}º Lugar
                                  </option>
                                ))}
                              </select>
                            </div>
                            <select
                              value={
                                athleteNames[entry.id] !== undefined
                                  ? athleteNames[entry.id]
                                  : entry.defaultName || ""
                              }
                              onChange={(e) =>
                                setAthleteNames((prev) => ({
                                  ...prev,
                                  [entry.id]: e.target.value,
                                }))
                              }
                              style={{
                                background: "rgba(0,0,0,0.2)",
                                border: "1px solid #333",
                                borderRadius: "6px",
                                padding: "8px",
                                color: "white",
                                fontSize: "13px",
                                width: "100%",
                              }}
                            >
                              <option value="">Selecione o atleta...</option>
                              {athletes
                                .filter((a) => athleteMatchesTeamAndMatch(a, entry.participant, selectedMatch))
                                .map((a, idx) => {
                                  const fullName = `${a.firstName} ${a.lastName}`;
                                  return (
                                    <option key={idx} value={fullName}>
                                      {fullName}
                                    </option>
                                  );
                                })}
                            </select>
                            {/* 3 campos separados: MM : SS . CC — versão corrigida */}
                            {(() => {
                              const parts = parseSwimmingTimeParts(swimmingTimes[entry.id] || "");

                              const inputBase: React.CSSProperties = {
                                width: "38px",
                                textAlign: "center",
                                background: "#121212",
                                border: "1.5px solid #333",
                                borderRadius: "8px",
                                padding: "9px 4px",
                                color: "#ffffff",
                                fontSize: "16px",
                                fontWeight: 700,
                                fontFamily: "'Courier New', monospace",
                                outline: "none",
                                transition: "border-color 0.15s, box-shadow 0.15s",
                                boxSizing: "border-box" as const,
                              };
                              const sep: React.CSSProperties = {
                                color: "#555",
                                fontSize: "20px",
                                fontWeight: 700,
                                userSelect: "none" as const,
                                lineHeight: 1,
                              };

                              // Lê o estado mais recente via updater funcional (evita stale closure)
                              const handleBlur = () => {
                                setSwimmingTimes(prev => {
                                  const p = parseSwimmingTimeParts(prev[entry.id] || "");
                                  if (!p.mm && !p.ss && !p.cc) return prev;
                                  // Valida overflow de segundos
                                  const ssNum = parseInt(p.ss || "0", 10);
                                  if (p.ss && ssNum > 59) {
                                    const s = sanitizeSwimmingTime(p.mm, p.ss, p.cc);
                                    return { ...prev, [entry.id]: `${s.mm}:${s.ss}.${s.cc}` };
                                  }
                                  // Zero-pad apenas campos que já foram digitados (não preenche vazios)
                                  const mm = p.mm ? p.mm.padStart(2, "0") : "";
                                  const ss = p.ss ? p.ss.padStart(2, "0") : "";
                                  const cc = p.cc ? p.cc.padStart(2, "0") : "";
                                  const val = mm || ss || cc ? `${mm}:${ss}.${cc}` : "";
                                  return { ...prev, [entry.id]: val };
                                });
                              };

                              // Reseta estilo ao perder foco (fix: onBlur resets border)
                              const handleBlurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
                                e.target.style.borderColor = "#333";
                                e.target.style.boxShadow = "none";
                              };
                              const handleFocusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
                                e.target.style.borderColor = "#3b82f6";
                                e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.2)";
                              };

                              return (
                                <div style={{
                                  display: "flex", alignItems: "center", gap: "3px",
                                  background: "rgba(255,255,255,0.03)", borderRadius: "10px",
                                  padding: "6px 10px", border: "1px solid rgba(255,255,255,0.06)",
                                  width: "fit-content",
                                }}>
                                  {/* Minutos */}
                                  <input
                                    id={`swim-mm-${entry.id}`}
                                    maxLength={2}
                                    inputMode="numeric"
                                    placeholder="MM"
                                    value={parts.mm}
                                    onChange={(e) => {
                                      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                                      // Lê parts.ss e parts.cc do estado atual (via closure do render)
                                      setSwimmingTimes(prev => {
                                        const p = parseSwimmingTimeParts(prev[entry.id] || "");
                                        const val = v || p.ss || p.cc ? `${v}:${p.ss}.${p.cc}` : "";
                                        return { ...prev, [entry.id]: val };
                                      });
                                      if (v.length === 2) document.getElementById(`swim-ss-${entry.id}`)?.focus();
                                    }}
                                    onBlur={(e) => { handleBlur(); handleBlurStyle(e); }}
                                    onFocus={handleFocusStyle}
                                    style={inputBase}
                                  />
                                  <span style={sep}>:</span>
                                  {/* Segundos */}
                                  <input
                                    id={`swim-ss-${entry.id}`}
                                    maxLength={2}
                                    inputMode="numeric"
                                    placeholder="SS"
                                    value={parts.ss}
                                    onKeyDown={(e) => {
                                      if (e.key === "Backspace" && parts.ss === "")
                                        document.getElementById(`swim-mm-${entry.id}`)?.focus();
                                    }}
                                    onChange={(e) => {
                                      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                                      setSwimmingTimes(prev => {
                                        const p = parseSwimmingTimeParts(prev[entry.id] || "");
                                        if (v.length === 2 && parseInt(v, 10) > 59) {
                                          // Auto-conversão imediata: 90s → +1min 30s
                                          const s = sanitizeSwimmingTime(p.mm, v, p.cc);
                                          return { ...prev, [entry.id]: `${s.mm}:${s.ss}.${s.cc}` };
                                        }
                                        const val = p.mm || v || p.cc ? `${p.mm}:${v}.${p.cc}` : "";
                                        return { ...prev, [entry.id]: val };
                                      });
                                      if (v.length === 2) document.getElementById(`swim-cc-${entry.id}`)?.focus();
                                    }}
                                    onBlur={(e) => { handleBlur(); handleBlurStyle(e); }}
                                    onFocus={handleFocusStyle}
                                    style={inputBase}
                                  />
                                  <span style={sep}>.</span>
                                  {/* Centésimos */}
                                  <input
                                    id={`swim-cc-${entry.id}`}
                                    maxLength={2}
                                    inputMode="numeric"
                                    placeholder="CC"
                                    value={parts.cc}
                                    onKeyDown={(e) => {
                                      if (e.key === "Backspace" && parts.cc === "")
                                        document.getElementById(`swim-ss-${entry.id}`)?.focus();
                                    }}
                                    onChange={(e) => {
                                      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                                      setSwimmingTimes(prev => {
                                        const p = parseSwimmingTimeParts(prev[entry.id] || "");
                                        const val = p.mm || p.ss || v ? `${p.mm}:${p.ss}.${v}` : "";
                                        return { ...prev, [entry.id]: val };
                                      });
                                    }}
                                    onBlur={(e) => { handleBlur(); handleBlurStyle(e); }}
                                    onFocus={handleFocusStyle}
                                    style={inputBase}
                                  />
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                        <button
                          onClick={() => {
                            if (storedSwimmingParticipants.length === 0) {
                              showNotification(
                                "Nenhuma equipe registrada na prova. Edite a partida e selecione as equipes antes de classificar.",
                              );
                              return;
                            }

                            const totalEntries = swimmingEntries.length;
                            const preparedEntries = swimmingEntries
                              .map((entry) => {
                                const nameValue =
                                  athleteNames[entry.id] !== undefined
                                    ? athleteNames[entry.id]
                                    : entry.defaultName;
                                return {
                                  entry,
                                  rank: swimmingRankings[entry.id],
                                  name: nameValue.trim(),
                                  time: (swimmingTimes[entry.id] || "").trim(),
                                };
                              })
                              .filter((item) => item.rank && item.name);

                            const ranks = preparedEntries.map(
                              (item) => item.rank as number,
                            );
                            const hasDuplicateRanks =
                              new Set(ranks).size !== ranks.length;
                            if (hasDuplicateRanks) {
                              showNotification(
                                "Existem posições duplicadas. Ajuste para continuar.",
                              );
                              return;
                            }

                            if (preparedEntries.length === 0) {
                              showNotification(
                                "Informe ao menos uma posição e nome para finalizar.",
                              );
                              return;
                            }

                            if (preparedEntries.length < totalEntries) {
                              if (
                                !confirm(
                                  `Apenas ${preparedEntries.length} de ${totalEntries} equipes foram ranqueadas. Deseja finalizar assim mesmo?`,
                                )
                              )
                                return;
                            }

                            const sortedResults = [...preparedEntries].sort(
                              (a, b) => (a.rank as number) - (b.rank as number),
                            );

                            const baseTimestamp = Date.now();
                            const resultEvents: MatchEvent[] = sortedResults.map(
                              (item, index) => {
                                const timeLabel = item.time ? ` (${item.time})` : "";
                                return {
                                  id: `evt_${baseTimestamp + index}_swim`,
                                  type: "swimming_result",
                                  minute: getCurrentEventMinute(),
                                  description: `${item.rank}º - ${item.name}${timeLabel} - ${item.entry.participant.name}`,
                                };
                              },
                            );

                            const endEvent: MatchEvent = {
                              id: `evt_${baseTimestamp + resultEvents.length + 1}_end`,
                              type: "end",
                              minute: getCurrentEventMinute(),
                              description: "Fim da prova",
                            };

                            const filteredEvents = (selectedMatch.events || []).filter(
                              (event) =>
                                event.type !== "swimming_result" &&
                                event.type !== "end",
                            );

                            const updatedMatch = {
                              ...selectedMatch,
                              participants: storedSwimmingParticipants,
                              teamA:
                                storedSwimmingParticipants[0] || selectedMatch.teamA,
                              teamB:
                                storedSwimmingParticipants[1] || selectedMatch.teamB,
                              status: "finished" as const,
                              events: [...filteredEvents, ...resultEvents, endEvent],
                            } as Match;

                            updateMatch(updatedMatch);
                            setIsRunning(false);
                            setIsRankingModalOpen(false);
                            showNotification("Resultado salvo e prova finalizada!");
                          }}
                          style={{
                            flex: 2,
                            background: "var(--success-color)",
                            color: "white",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "none",
                            fontWeight: 800,
                            cursor: "pointer",
                            fontSize: "16px",
                            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                          }}
                        >
                          Confirmar e Finalizar
                        </button>
                        <button
                          onClick={() => setIsRankingModalOpen(false)}
                          style={{
                            flex: 1,
                            background: "#333",
                            color: "white",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "none",
                            fontWeight: 800,
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cronologia de Eventos */}
                <div style={styles.timeline}>
                  <h3 style={styles.sectionTitle}>📋 Cronologia</h3>
                  <div style={styles.timelineList} className="timeline-list-beauty">
                    {!selectedMatch.events || selectedMatch.events.length === 0 ? (
                      <p style={styles.noEvents}>Nenhum evento registrado ainda.</p>
                    ) : (
                      timelineEvents.map((event) => {
                        const isTeamA = event.teamId === selectedMatch.teamA.id;
                        const isTeamB = event.teamId === selectedMatch.teamB.id;
                        const isGeneral = !event.teamId;
                        const rowJustify = isGeneral
                          ? "center"
                          : isTeamA
                            ? "flex-start"
                            : "flex-end";
                        const cardWidth = isGeneral ? "46%" : "48%";
                        const shortTeamName = isTeamA
                          ? selectedMatchTeamAShortName
                          : isTeamB
                            ? selectedMatchTeamBShortName
                            : "Jogo";

                        return (
                          <div
                            key={event.id}
                            className="timeline-row-beauty"
                            style={{
                              display: "flex",
                              justifyContent: rowJustify,
                              marginBottom: "6px",
                            }}
                          >
                            <div
                              className={`timeline-item-beauty ${isTeamA ? "timeline-team-a" : ""} ${isTeamB ? "timeline-team-b" : ""} ${isGeneral ? "timeline-neutral" : ""}`}
                              style={{ ...styles.timelineItem, width: cardWidth }}
                            >
                              {isBasketball && event.type === "goal" ? (
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                    width: "100%",
                                    gap: "6px",
                                    alignItems: "center",
                                  }}
                                >
                                  {(() => {
                                    const data = getBasketballEventData(event, selectedMatch);
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
                                  {!isSetSport && !isNoTimerSport && !isSwimming && (
                                    <span style={styles.eventTimePill}>
                                      {formatClock(event.minute)}
                                    </span>
                                  )}
                                  <span style={styles.eventIconBubble}>
                                    {getEventIcon(event.type, {
                                      isBasketball,
                                      isBeachTennis,
                                      isVolleyball,
                                      isTamboreu,
                                      isKarate,
                                      isJudo,
                                    })}
                                  </span>
                                  <div
                                    style={{
                                      ...styles.eventContentWrap,
                                      textAlign: isTeamB
                                        ? "right"
                                        : isGeneral
                                          ? "center"
                                          : "left",
                                    }}
                                  >
                                    <span style={styles.eventText}>
                                      {getEventLabel(event, {
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
                                      })}
                                    </span>
                                    {event.timelineScore && !isBasketball && (
                                      <span
                                        style={{
                                          fontSize: "12px",
                                          color: "var(--accent-color)",
                                          marginLeft: "8px",
                                          fontWeight: 700,
                                          background: "rgba(227, 6, 19, 0.1)",
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                        }}
                                      >
                                        {event.timelineScore}
                                      </span>
                                    )}
                                    {event.teamId && !isBasketball && (
                                      <span style={styles.eventMetaTag}>
                                        {shortTeamName}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Modal de Seleção de Jogador — fora do wrapper para funcionar durante a disputa */}
            {showPlayerInput && selectedMatch && (
              <div style={styles.modal}>
                <div style={styles.modalContentLarge}>
                  <h3 style={styles.modalTitle}>
                    {showPlayerInput.type === "goal" && (
                      isBasketball
                        ? `🏀 +${showPlayerInput.points} Ponto${(showPlayerInput.points ?? 1) > 1 ? "s" : ""} — Quem converteu?`
                        : isKarate || isJudo ? "🥋 Quem pontuou?" : "⚽ Quem fez o gol?"
                    )}
                    {showPlayerInput.type === "yellow_card" && "🟨 Cartão Amarelo"}
                    {showPlayerInput.type === "red_card" && "🟥 Cartão Vermelho"}
                    {showPlayerInput.type === "penalty_scored" && (
                      showPlayerInput.isShootout ? "🎯 Quem cobrou o pênalti?" : "🎯 Pênalti Marcado"
                    )}
                    {showPlayerInput.type === "penalty_missed" && showPlayerInput.isShootout && "❌ Quem cobrou (e perdeu)?"}
                  </h3>
                  <div style={styles.modalSubtitle}>
                    {showPlayerInput.team === "A"
                      ? selectedMatch.teamA.name
                      : selectedMatch.teamB.name}
                  </div>
                  {(() => {
                    const team =
                      showPlayerInput.team === "A"
                        ? selectedMatch.teamA
                        : selectedMatch.teamB;
                    const availableAthletes = athletes.filter((a) =>
                      athleteMatchesTeamAndMatch(a, team),
                    );
                    const isShootoutModal = showPlayerInput.isShootout;
                    // Jogadores já utilizados nesta disputa para este time
                    const usedPlayers = showPlayerInput.team === "A"
                      ? shootoutStats.usedPlayersA
                      : shootoutStats.usedPlayersB;
                    // Ordena: disponíveis primeiro, já utilizados por último
                    const sortedAthletes = isShootoutModal
                      ? [...availableAthletes].sort((a, b) => {
                        const nameA = `${a.firstName} ${a.lastName}`;
                        const nameB = `${b.firstName} ${b.lastName}`;
                        const usedA = usedPlayers.includes(nameA);
                        const usedB = usedPlayers.includes(nameB);
                        if (usedA === usedB) return 0;
                        return usedA ? 1 : -1;
                      })
                      : availableAthletes;
                    return (
                      <div style={styles.playerList} className="player-list">
                        {sortedAthletes.map((athlete) => {
                          const playerName = `${athlete.firstName} ${athlete.lastName}`;
                          const stats = getPlayerStats(playerName);
                          const alreadyUsed = isShootoutModal && usedPlayers.includes(playerName);
                          // Pode cobrar se: não expulso. Se já usou, pode repetir só se todos já cobram
                          const allUsed = isShootoutModal && availableAthletes.every(a => usedPlayers.includes(`${a.firstName} ${a.lastName}`));
                          const canAct = isShootoutModal
                            ? !stats.redCards && (!alreadyUsed || allUsed)
                            : stats.canPlay;
                          return (
                            <button
                              key={athlete.id}
                              className={canAct ? "player-item-hover" : ""}
                              style={{
                                ...styles.playerItem,
                                ...(canAct ? {} : styles.playerItemDisabled),
                              }}
                              onClick={() => canAct && confirmPlayerEvent(playerName)}
                              disabled={!canAct}
                            >
                              <span style={styles.playerName}>{playerName}</span>
                              <div style={styles.playerStats}>
                                {isShootoutModal && alreadyUsed && !allUsed && (
                                  <span style={{ ...styles.statBadge, color: '#f59e0b' }}>já cobrou</span>
                                )}
                                {stats.redCards > 0 && (
                                  <span style={styles.statBadgeRed}>🟥 EXPULSO</span>
                                )}
                                {!isShootoutModal && stats.yellowCards > 0 && (
                                  <span style={styles.statBadge}>🟨 {stats.yellowCards}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {sortedAthletes.length === 0 && (
                          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                            Nenhum atleta encontrado para esta modalidade e sexo nesta equipe.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <button
                    style={{ ...styles.modalBtn, ...styles.cancelBtn, marginTop: "16px" }}
                    onClick={cancelPlayerInput}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal seletor de jogador para ponto no Vôlei de Praia */}
        {beachPointPicker && selectedMatch && (() => {
          const team = beachPointPicker.team;
          const teamObj = team === "A" ? selectedMatch.teamA : selectedMatch.teamB;
          const teamColor = team === "A" ? "#3b82f6" : "#ef4444";
          const availableAthletes = athletes.filter((a) => athleteMatchesTeamAndMatch(a, teamObj, selectedMatch));
          return (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}
              onClick={() => setBeachPointPicker(null)}
            >
              <div
                style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "24px", minWidth: "280px", maxWidth: "360px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: teamColor, marginBottom: "4px" }}>
                    🏐 Ponto — {getTeamShortName(teamObj)}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Quem fez o ponto?
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                  {availableAthletes.length === 0 ? (
                    <div style={{ color: "var(--text-secondary)", fontSize: "13px", textAlign: "center", padding: "12px 0" }}>
                      Nenhum atleta cadastrado para este time.
                    </div>
                  ) : (
                    availableAthletes.map((athlete) => {
                      const name = `${athlete.firstName} ${athlete.lastName}`;
                      return (
                        <button
                          key={athlete.id}
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${teamColor}44`, borderRadius: "8px", padding: "10px 14px", color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                          onMouseOver={(e) => (e.currentTarget.style.background = `${teamColor}22`)}
                          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                          onClick={() => {
                            setBeachPointPicker(null);
                            handleVolleyPointWithPlayer(team, name);
                          }}
                        >
                          {name}
                        </button>
                      );
                    })
                  )}
                  <button
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "10px 14px", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer", marginTop: "4px" }}
                    onClick={() => {
                      setBeachPointPicker(null);
                      handleVolleyPointWithPlayer(team, null);
                    }}
                  >
                    Registrar sem jogador
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "var(--bg-main)",
    color: "var(--text-primary)",
    padding: "20px",
  },
  header: {
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "16px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "20px",
    marginBottom: "16px",
    color: "var(--text-secondary)",
  },
  changeMatchBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.05)",
    color: "var(--text-secondary)",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid var(--border-color)",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    marginTop: "12px",
  },
  resetBtn: {
    backgroundColor: "var(--secondary-color)",
    color: "var(--text-primary)",
    padding: "10px 20px",
    borderRadius: "var(--border-radius)",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid var(--border-color)",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  matchList: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  },
  matchItem: {
    backgroundColor: "var(--bg-card)",
    padding: "20px",
    borderRadius: "var(--border-radius)",
    cursor: "pointer",
    border: "1px solid var(--border-color)",
    transition: "all 0.2s",
  },
  matchInfo: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  sportBadge: {
    backgroundColor: "var(--accent-color)",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
  },
  categoryBadge: {
    backgroundColor: "var(--secondary-color)",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
  },
  matchTeams: {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "8px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  vs: {
    color: "var(--text-secondary)",
    fontSize: "14px",
  },
  matchDateTime: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  noMatches: {
    color: "var(--text-secondary)",
    textAlign: "center",
    padding: "40px",
  },
  scoreboard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--bg-card)",
    padding: "32px",
    borderRadius: "var(--border-radius)",
    marginBottom: "24px",
    border: "2px solid var(--border-color)",
  },
  team: {
    flex: 1,
    textAlign: "center",
  },
  teamLeft: {
    flex: 1,
    textAlign: "left",
  },
  teamRight: {
    flex: 1,
    textAlign: "right",
  },
  teamName: {
    fontSize: "1.4rem",
    lineHeight: 1.3,
    margin: 0,
  },
  score: {
    fontSize: "64px",
    fontWeight: 700,
    color: "white",
    marginTop: "8px",
  },
  timeDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "0 40px",
  },
  minute: {
    fontSize: "32px",
    fontWeight: 700,
  },
  liveBadge: {
    backgroundColor: "var(--live-color)",
    color: "white",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.4px",
    marginTop: "8px",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
  },
  gameControls: {
    backgroundColor: "var(--bg-card)",
    padding: "24px",
    borderRadius: "var(--border-radius)",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
  },
  controlButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },
  controlBtn: {
    padding: "12px 20px",
    borderRadius: "var(--border-radius)",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s",
    border: "1px solid",
  },
  startBtn: {
    backgroundColor: "#22c55e",
    color: "white",
    borderColor: "#16a34a",
  },
  pauseBtn: {
    backgroundColor: "#f59e0b",
    color: "white",
    borderColor: "#d97706",
  },
  resumeBtn: {
    backgroundColor: "#3b82f6",
    color: "white",
    borderColor: "#2563eb",
  },
  endBtn: {
    backgroundColor: "#ef4444",
    color: "white",
    borderColor: "#dc2626",
  },
  eventSection: {
    backgroundColor: "var(--bg-card)",
    padding: "24px",
    borderRadius: "var(--border-radius)",
    marginBottom: "16px",
  },
  eventButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  eventBtn: {
    padding: "16px",
    borderRadius: "var(--border-radius)",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s",
    border: "1px solid",
  },
  teamABtn: {
    backgroundColor: "#1e40af",
    color: "white",
    borderColor: "#1e3a8a",
  },
  teamBBtn: {
    backgroundColor: "#b91c1c",
    color: "white",
    borderColor: "#991b1b",
  },
  yellowBtn: {
    backgroundColor: "#ca8a04",
    color: "white",
    borderColor: "#a16207",
  },
  redBtn: {
    backgroundColor: "#dc2626",
    color: "white",
    borderColor: "#b91c1c",
  },
  penaltyBtn: {
    backgroundColor: "#7c3aed",
    color: "white",
    borderColor: "#6d28d9",
  },
  penaltyMissedBtn: {
    backgroundColor: "#475569",
    color: "white",
    borderColor: "#334155",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "var(--bg-card)",
    padding: "32px",
    borderRadius: "var(--border-radius)",
    width: "min(420px, calc(100vw - 24px))",
    border: "1px solid var(--border-color)",
  },
  modalContentLarge: {
    backgroundColor: "var(--bg-card)",
    padding: "32px",
    borderRadius: "var(--border-radius)",
    width: "min(600px, calc(100vw - 24px))",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--border-color)",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: 600,
    marginBottom: "12px",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    textAlign: "center",
    marginBottom: "20px",
    fontWeight: 600,
  },
  playerList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
    maxHeight: "400px",
    marginBottom: "16px",
    paddingRight: "8px",
  },
  playerItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "var(--bg-main)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--border-radius)",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
  },
  playerItemDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    backgroundColor: "var(--secondary-color)",
  },
  playerName: {
    fontSize: "15px",
    fontWeight: 500,
    flex: 1,
  },
  playerStats: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  statBadge: {
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "10px",
    backgroundColor: "var(--secondary-color)",
    fontWeight: 600,
  },
  statBadgeRed: {
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "10px",
    backgroundColor: "var(--live-color)",
    color: "white",
    fontWeight: 700,
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
  },
  modalBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "var(--border-radius)",
    fontSize: "14px",
    fontWeight: 600,
  },
  confirmBtn: {
    backgroundColor: "var(--accent-color)",
    color: "white",
  },
  cancelBtn: {
    backgroundColor: "var(--secondary-color)",
    color: "var(--text-primary)",
  },
  timeline: {
    backgroundColor: "var(--bg-card)",
    padding: "24px",
    borderRadius: "var(--border-radius)",
  },
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  timelineItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "8px 10px",
    backgroundColor: "var(--bg-main)",
    borderRadius: "var(--border-radius)",
    border: "1px solid var(--border-color)",
    justifyContent: "flex-start",
  },
  eventTimePill: {
    fontWeight: 700,
    color: "white",
    minWidth: "40px",
    textAlign: "center",
    fontSize: "12px",
    background: "var(--accent-color)",
    borderRadius: "999px",
    padding: "4px 8px",
    flexShrink: 0,
  },
  eventIconBubble: {
    fontSize: "18px",
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid var(--border-color)",
    flexShrink: 0,
  },
  eventContentWrap: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "6px",
  },
  eventText: {
    flex: 1,
    minWidth: 0,
    fontSize: "14px",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  eventMetaTag: {
    fontSize: "11px",
    color: "var(--text-secondary)",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border-color)",
    borderRadius: "999px",
    padding: "4px 8px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  noEvents: {
    color: "var(--text-secondary)",
    textAlign: "center",
    padding: "20px",
  },
};

export default MatchTimeline;
