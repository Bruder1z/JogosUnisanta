import { type FC, useState, useEffect } from "react";
import {
  X,
  Clock,
  MapPin,
  Trophy,
  Play,
  CheckCircle,
  Pause,
} from "lucide-react";
import {
  type Match,
  type MatchEvent,
  COURSE_EMBLEMS,
} from "../../data/mockData";
import { useData } from "../context/DataContext";

interface MatchModalProps {
  match: Match;
  onClose: () => void;
}

const MatchModal: FC<MatchModalProps> = ({ match: initialMatch, onClose }) => {
  const { matches: allMatches } = useData();
  const [currentMatch, setCurrentMatch] = useState<Match>(initialMatch);
  const [showChat, setShowChat] = useState(false);

  // Sync state if initialMatch changes in context
  useEffect(() => {
    const liveMatch = allMatches.find((m) => m.id === initialMatch.id);
    if (liveMatch) setCurrentMatch(liveMatch);
  }, [allMatches, initialMatch.id]);
  const normalizeText = (value?: string) => (value || "").trim().toLowerCase();

  const teamIdentityMatches = (
    teamRef: Match["teamA"],
    teamCandidate: Match["teamA"],
  ) => {
    if (teamRef.id && teamCandidate.id && teamRef.id === teamCandidate.id)
      return true;

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
    teamIdentityMatches(teamRef, m.teamA) ||
    teamIdentityMatches(teamRef, m.teamB);

  // H2H and Form Logic
  const h2hMatches = allMatches.filter((m: Match) => {
    if (m.status !== "finished" || m.id === currentMatch.id) return false;
    if (m.sport !== currentMatch.sport || m.category !== currentMatch.category)
      return false;

    const hasTeamA = matchHasTeam(m, currentMatch.teamA);
    const hasTeamB = matchHasTeam(m, currentMatch.teamB);
    return hasTeamA && hasTeamB;
  });

  let teamAWins = 0;
  let teamBWins = 0;
  let draws = 0;

  h2hMatches.forEach((m: Match) => {
    const isCurrentTeamAInSlotA = teamIdentityMatches(
      currentMatch.teamA,
      m.teamA,
    );
    const isCurrentTeamAInSlotB = teamIdentityMatches(
      currentMatch.teamA,
      m.teamB,
    );

    if (!isCurrentTeamAInSlotA && !isCurrentTeamAInSlotB) return;

    const myScore = isCurrentTeamAInSlotA ? m.scoreA : m.scoreB;
    const oppScore = isCurrentTeamAInSlotA ? m.scoreB : m.scoreA;

    if (myScore > oppScore) teamAWins++;
    else if (myScore < oppScore) teamBWins++;
    else draws++;
  });

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

  const isBeachTennis = currentMatch.sport === "Beach Tennis";
  const isFutsal = currentMatch.sport === "Futsal";
  const isFutebolSociety = currentMatch.sport === "Futebol Society";
  const isTamboreu = currentMatch.sport === "Tamboréu";
  const isSetSport = [
    "Vôlei",
    "Vôlei de Praia",
    "Tênis de Mesa",
    "Futevôlei",
  ].includes(currentMatch.sport);
  const isVolleyballFamilySport = [
    "Vôlei",
    "Vôlei de Praia",
    "Futevôlei",
  ].includes(currentMatch.sport);
  const isBasketball =
    currentMatch.sport === "Basquetebol" ||
    currentMatch.sport === "Basquete 3x3";
  const isSwimming = currentMatch.sport === "Natação";
  const isKarate = currentMatch.sport === "Caratê";
  const isJudo = currentMatch.sport === "Judô";
  const isXadrez = currentMatch.sport === "Xadrez";
  const hideTimelineMinute = [
    "Vôlei",
    "Vôlei de Praia",
    "Tênis de Mesa",
    "Futevôlei",
    "Beach Tennis",
    "Natação",
    "Caratê",
    "Judô",
    "Xadrez",
  ].includes(currentMatch.sport);
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

  const getSetBreakdown = () => {
    if (!isResultBreakdownSport)
      return [] as Array<{
        setNumber: number;
        winnerTeamName: string;
        scoreA: number;
        scoreB: number;
      }>;

    const events = [...(currentMatch.events || [])].sort(
      (a, b) =>
        a.minute - b.minute ||
        getEventTimestamp(a.id) - getEventTimestamp(b.id),
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

      // Fallback when a set is finalized without goal events in the segment.
      if (scoreA === 0 && scoreB === 0 && event.description) {
        const scoreFromDescription = event.description.match(
          /\((\d+)\s*x\s*(\d+)\)/i,
        );
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
      (a, b) =>
        a.minute - b.minute ||
        getEventTimestamp(a.id) - getEventTimestamp(b.id),
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

      if (
        event.type === "set_win" &&
        event.description?.startsWith("Game para ")
      ) {
        pointA = 0;
        pointB = 0;
      }

      if (
        event.type === "set_win" &&
        event.description?.startsWith("Set para ")
      ) {
        if (event.teamId === currentMatch.teamA.id) setsA += 1;
        if (event.teamId === currentMatch.teamB.id) setsB += 1;
        pointA = 0;
        pointB = 0;
      }
    });

    return { setsA, setsB, pointA, pointB };
  })();

  const BEACH_POINT_LABELS = ["0", "15", "30", "40"];

  const getTeamEmblem = (team: any) => {
    if (team.logo) return team.logo;
    if (team.course && team.course in COURSE_EMBLEMS) {
      return `/emblemas/${COURSE_EMBLEMS[team.course]}`;
    }
    return null;
  };

  const TeamHeaderDisplay = ({ team }: { team: any }) => {
    const emblemUrl = getTeamEmblem(team);
    return (
      <div style={{ flex: 1, textAlign: "center" }}>
        <div
          style={{
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "10px",
          }}
        >
          {emblemUrl ? (
            <img
              src={emblemUrl}
              alt={team.name}
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget
                  .nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "block";
              }}
            />
          ) : null}
          <div
            style={{
              fontSize: "40px",
              display: emblemUrl ? "none" : "block",
            }}
          >
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
      case "red_card":
        return (
          <div
            style={{
              width: 12,
              height: 16,
              background: "#ff4444",
              borderRadius: 2,
            }}
          />
        );
      case "penalty_scored":
        return <div style={{ fontSize: "16px" }}>⚽</div>;
      case "penalty_missed":
        return <div style={{ fontSize: "16px" }}>❌</div>;
      case "shootout_scored":
        return <div style={{ fontSize: "16px" }}>⚽</div>;
      case "shootout_missed":
        return <div style={{ fontSize: "16px" }}>❌</div>;
      case "start":
        return <Play size={16} color="var(--accent-color)" />;
      case "halftime":
        return <Pause size={16} color="#f59e0b" />;
      case "end":
        return <CheckCircle size={16} color="#44ff44" />;
      case "draw":
        return <div style={{ fontSize: "16px" }}>½</div>;
      case "chess_result":
        return <Trophy size={16} color="#ffd700" />;
      default:
        return null;
    }
  };

  const getEventLabel = (type: MatchEvent["type"]) => {
    switch (type) {
      case "goal":
        if (isKarate || isJudo) return "PONTO!";
        if (isTamboreu) return "PONTO!";
        return isVolleyballFamilySport ? "PONTO!" : "GOL!";
      case "set_win":
        return "Fim do Set";
      case "yellow_card":
        return "Cartão Amarelo";
      case "red_card":
        return "Cartão Vermelho";
      case "penalty_scored":
        return "Pênalti Marcado";
      case "penalty_missed":
        return "Pênalti Perdido";
      case "shootout_scored":
        return "GOL de Shoot-out";
      case "shootout_missed":
        return "❌ Shoot-out Perdido";
      case "start":
        return "Início da Partida";
      case "halftime":
        return "Intervalo";
      case "end":
        return "Fim da Partida";
      case "draw":
        return "Empate (Tabuada)";
      case "chess_result":
        return "Resultado";
      case "swimming_result":
        return "Resultado da Prova";
      default:
        return "";
    }
  };

  const getSafeEventDescription = (event: MatchEvent) => {
    const baseLabel = event.description
      ? event.description
      : getEventLabel(event.type);
    const keepScoreTogether = (text: string) =>
      text.replace(/(\d+)\s*x\s*(\d+)/g, "$1\u00A0x\u00A0$2");

    if (currentMatch.sport === "Handebol" && event.type === "goal") {
      const withPlayer =
        event.player && !baseLabel.includes(event.player)
          ? `${baseLabel} - ${event.player}`
          : baseLabel;
      return keepScoreTogether(withPlayer);
    }

    if (!event.player) return keepScoreTogether(baseLabel);

    return keepScoreTogether(
      baseLabel
        .replace(` - ${event.player}`, "")
        .replace(`(${event.player})`, "")
        .replace(new RegExp(`\\s${event.player}$`), "")
        .replace(/\s{2,}/g, " ")
        .trim(),
    );
  };

  const stripLeadingEmoji = (text: string) =>
    text.replace(/^[^\p{L}\p{N}]+/u, "").trim();

  const getTimelinePrimaryText = (event: MatchEvent) => {
    const teamName =
      event.teamId === currentMatch.teamA.id
        ? currentMatch.teamA.name.split(" - ")[0]
        : event.teamId === currentMatch.teamB.id
          ? currentMatch.teamB.name.split(" - ")[0]
          : "Jogo";

    if (event.type === "goal") {
      if (isBeachTennis || isVolleyballFamilySport || isKarate || isJudo || isTamboreu) {
        return `Ponto para ${teamName}`;
      }
      if (event.player) {
        return `GOL! ${event.player}`;
      }
      if ((isFutsal || isFutebolSociety) && event.description) {
        return stripLeadingEmoji(event.description);
      }
      return `GOL! ${teamName}`;
    }

    if (event.type === "swimming_result") {
      return event.description || "Resultado da prova";
    }

    if (event.type === "penalty_scored") {
      return event.player
        ? `Pênalti convertido! ${event.player}`
        : "Pênalti convertido!";
    }

    if (event.type === "yellow_card") {
      return event.player
        ? `Cartão Amarelo - ${event.player}`
        : "Cartão Amarelo";
    }

    if (event.type === "red_card") {
      return event.player
        ? `Cartão Vermelho - ${event.player}`
        : "Cartão Vermelho";
    }

    if (event.type === "draw") {
      return "Empate (Tabuada)";
    }

    if (event.type === "chess_result") {
      return event.description || "Vitória";
    }

    return stripLeadingEmoji(getSafeEventDescription(event));
  };

  const getBasketballEventData = (event: TimelineEvent) => {
    const pointValue = Number(event.description?.match(/\+(\d+)/)?.[1] || 1);
    const totalSeconds = Math.max(0, event.minute);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const teamName =
      event.teamId === currentMatch.teamA.id
        ? currentMatch.teamA.name.split(" - ")[0]
        : event.teamId === currentMatch.teamB.id
          ? currentMatch.teamB.name.split(" - ")[0]
          : "Faculdade";

    return {
      tempo: `${minutes}:${String(seconds).padStart(2, "0")}`,
      pontuacaoLabel: `+${pointValue} ${pointValue > 1 ? "pontos" : "ponto"} para ${teamName}`,
      placar: (event.timelineScore || "0x0").replace("x", "-"),
    };
  };

  const formatEventClock = (value: number) => {
    const totalSeconds = Math.max(0, value);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
    let beachSetsA = 0;
    let beachSetsB = 0;
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

        if (
          event.type === "set_win" &&
          event.description?.startsWith("Set para ")
        ) {
          if (event.teamId === currentMatch.teamA.id) beachSetsA += 1;
          if (event.teamId === currentMatch.teamB.id) beachSetsB += 1;
          beachGamesA = 0;
          beachGamesB = 0;
          beachPointsA = 0;
          beachPointsB = 0;
        }

        return {
          ...event,
          timelineScore: `Game ${beachGamesA}x${beachGamesB} | Pontos ${BEACH_POINT_LABELS[Math.min(beachPointsA, 3)]}-${BEACH_POINT_LABELS[Math.min(beachPointsB, 3)]}`,
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
  //     const newEvents: MatchEvent[] = [{ id: `start-${Date.now()}`, type: 'start', minute: 0 }];
  //
  //     let currentMin = 5;
  //     for (let i = 0; i < scoreA; i++) {
  //         currentMin += Math.floor(Math.random() * 10) + 1;
  //         newEvents.push({ id: `goalA-${i}`, type: isVolleyball ? 'set_win' : 'goal', minute: currentMin, teamId: currentMatch.teamA.id, player: `Jogador ${i + 1} A` });
  //     }
  //     currentMin = 5;
  //     for (let i = 0; i < scoreB; i++) {
  //         currentMin += Math.floor(Math.random() * 10) + 1;
  //         newEvents.push({ id: `goalB-${i}`, type: isVolleyball ? 'set_win' : 'goal', minute: currentMin, teamId: currentMatch.teamB.id, player: `Jogador ${i + 1} B` });
  //     }
  //
  //     newEvents.push({ id: `end-${Date.now()}`, type: 'end', minute: 90 });
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
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      {/* Modal principal */}
      <div
        className="premium-card"
        style={{
          position: "relative",
          width: showChat ? "600px" : "100%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "modalSlideUp 0.3s ease-out",
          padding: 0,
          transition: "width 0.3s",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border-color)",
            background:
              "linear-gradient(to bottom, var(--bg-hover), var(--bg-primary))",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >

          <div style={{ flex: 1, minWidth: 0 }}>

            <div
              style={{
                textAlign: "center",
                marginBottom: "10px",
                fontSize: "12px",
                color: "var(--accent-color)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {currentMatch.sport}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
            {isSwimming ? (
              <div style={{ width: "100%", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "10px",
                  }}
                >
                  Equipes participantes
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  {(swimmingParticipants.length
                    ? swimmingParticipants
                    : [currentMatch.teamA, currentMatch.teamB]
                  ).map((team) => (
                    <span
                      key={team.id}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid var(--border-color)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {team.name.split(" - ")[0]}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <TeamHeaderDisplay team={currentMatch.teamA} />

                <div style={{ padding: "0 20px", textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      color: "var(--text-primary)",
                    }}
                  >
                    <span>
                      {isBeachTennis
                        ? beachLiveState.setsA
                        : currentMatch.scoreA}
                    </span>
                    <span
                      style={{
                        fontSize: "20px",
                        color: "var(--text-secondary)",
                        fontWeight: 700,
                      }}
                    >
                      X
                    </span>
                    <span>
                      {isBeachTennis
                        ? beachLiveState.setsB
                        : currentMatch.scoreB}
                    </span>
                  </div>
                  {isBeachTennis && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                        marginTop: "2px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--accent-color)",
                          fontWeight: 700,
                        }}
                      >
                        Games: {currentMatch.scoreA} - {currentMatch.scoreB}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          fontWeight: 700,
                        }}
                      >
                        Pontos:{" "}
                        {BEACH_POINT_LABELS[Math.min(beachLiveState.pointA, 3)]}{" "}
                        -{" "}
                        {BEACH_POINT_LABELS[Math.min(beachLiveState.pointB, 3)]}
                      </div>
                    </div>
                  )}
                  {[
                    "Vôlei",
                    "Vôlei de Praia",
                    "Tênis de Mesa",
                    "Futevôlei",
                  ].includes(currentMatch.sport) &&
                    currentMatch.status === "live" && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--accent-color)",
                          fontWeight: 700,
                          marginTop: "2px",
                        }}
                      >
                        {(() => {
                          const lastSetWinEvent = [
                            ...(currentMatch.events || []),
                          ]
                            .reverse()
                            .find((e) => e.type === "set_win");
                          const events = lastSetWinEvent
                            ? currentMatch.events?.slice(
                                currentMatch.events.indexOf(lastSetWinEvent) +
                                  1,
                              ) || []
                            : currentMatch.events || [];
                          const ptsA = events.filter(
                            (e) =>
                              e.type === "goal" &&
                              e.teamId === currentMatch.teamA.id,
                          ).length;
                          const ptsB = events.filter(
                            (e) =>
                              e.type === "goal" &&
                              e.teamId === currentMatch.teamB.id,
                          ).length;
                          return `${ptsA} - ${ptsB} (Pt)`;
                        })()}
                      </div>
                    )}
                  {currentMatch.status === "live" &&
                    ![
                      "Vôlei",
                      "Vôlei de Praia",
                      "Tênis de Mesa",
                      "Futevôlei",
                    ].includes(currentMatch.sport) && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--live-color)",
                          fontWeight: 700,
                          background: "rgba(255, 68, 68, 0.1)",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          marginTop: "5px",
                          display: "inline-block",
                        }}
                      >
                        AO VIVO
                      </div>
                    )}
                </div>

                <TeamHeaderDisplay team={currentMatch.teamB} />
              </>
            )}
          </div>

            <div
              style={{
                marginTop: "15px",
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} />
              {currentMatch.date.split("-").reverse().join("-")} às{" "}
              {currentMatch.time}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={14} />
              {currentMatch.location}
            </div>
          </div>

            </div>
            {/* Botões de ação no topo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
              background: "var(--bg-hover)",
              border: "none",
              color: "var(--text-secondary)",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              }}
              title="Fechar"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => setShowChat((v) => !v)}
              style={{
              background: showChat ? "var(--accent-color)" : "var(--bg-hover)",
              border: "none",
              color: showChat ? "#fff" : "var(--text-secondary)",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              }}
              title={showChat ? "Fechar chat" : "Abrir chat da partida"}
            >
              <span role="img" aria-label="Chat">💬</span>
            </button>
            </div>
        </div>

        {/* Scrollable Content Body */}
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            background: "var(--bg-primary)",
          }}
        >
          {isResultBreakdownSport && setBreakdown.length > 0 && (
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid var(--border-color)",
                background: "var(--bg-card)",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  marginBottom: "14px",
                  color: "var(--text-primary)",
                }}
              >
                Resultado por Sets
              </h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {setBreakdown.map((setItem) => (
                  <div
                    key={`set-${setItem.setNumber}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "10px",
                      padding: "10px 12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Set {setItem.setNumber}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                      }}
                    >
                      {setItem.scoreA} x {setItem.scoreB}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--accent-color)",
                      }}
                    >
                      {setItem.winnerTeamName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          {!isSwimming && (
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
          )}
        </div>

      </div>

      {/* Chat lateral */}
      {showChat && (
        <div
          style={{
            width: 340,
            maxWidth: "90vw",
            height: "80vh",
            background: "var(--bg-card)",
            borderRadius: "12px",
            marginLeft: "16px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "modalSlideUp 0.3s ease-out",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            padding: "16px",
            borderBottom: "1px solid var(--border-color)",
            fontWeight: 700,
            fontSize: "16px",
            color: "var(--accent-color)",
            background: "var(--bg-hover)",
            textAlign: "center"
          }}>
            Chat da Partida
          </div>
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", color: "var(--text-secondary)", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ opacity: 0.7 }}>Nenhuma mensagem ainda.</span>
          </div>
          <div style={{ padding: "12px", borderTop: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
            <input
              type="text"
              placeholder="Digite uma mensagem... (em breve)"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-main)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none"
              }}
              disabled
            />
          </div>
        </div>
      )}

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
    </div>
  );
};

export default MatchModal;
