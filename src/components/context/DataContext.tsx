import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  mockAthletes as initialAthletes,
  mockMatches,
  mockRanking as initialRanking,
  type Match,
  type RankingEntry,
} from "../../data/mockData";
import {
  matchesApi,
  coursesApi,
  athletesApi,
  rankingApi,
  featuredAthletesApi,
  mvpApi,
} from "../../services/api";

export interface FeaturedAthlete {
  id: string;
  name: string;
  institution: string;
  course: string;
  sport: string;
  reason: string;
}

export interface MatchMvpCandidate {
  id: string;
  matchId: string;
  sport: string;
  playerName: string;
  teamId: string;
  teamName: string;
  institution: string;
  course: string;
  points: number;
  votes: number;
}

export interface MatchMvpCandidateInput {
  matchId: string;
  sport: string;
  playerName: string;
  teamId: string;
  teamName: string;
  institution: string;
  course: string;
  points: number;
}

export interface MatchMvpVote {
  id: string;
  matchId: string;
  candidateId: string;
  voterUserId: string;
  voterEmail: string | null;
}

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  institution: string;
  course: string;
  sports: string[];
  sex?: "Masculino" | "Feminino";
}

interface DataContextType {
  courses: string[];
  addCourse: (course: string, emblem_url?: string) => void;
  removeCourse: (course: string) => void;
  athletes: Athlete[];
  addAthlete: (athlete: Athlete) => void;
  removeAthlete: (id: string) => void;
  customEmblems: Record<string, string>;
  addCustomEmblem: (course: string, base64: string) => void;
  matches: Match[];
  addMatch: (match: Match) => void;
  updateMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  deleteScheduledMatches: () => Promise<void>;
  ranking: RankingEntry[];
  updateRankingPoints: (course: string, newPoints: number) => void;
  featuredAthletes: FeaturedAthlete[];
  addFeaturedAthlete: (athlete: FeaturedAthlete) => Promise<void>;
  removeFeaturedAthlete: (id: string) => Promise<void>;
  mvpCandidates: MatchMvpCandidate[];
  ensureMatchMvpCandidates: (candidates: MatchMvpCandidateInput[]) => Promise<boolean>;
  mvpVotes: MatchMvpVote[];
  hasUserVotedMatch: (matchId: string, voterUserId: string, voterEmail?: string | null) => boolean;
  voteMatchMvpCandidate: (
    candidateId: string,
    currentVotes: number,
    matchId: string,
    voterUserId: string,
    voterEmail?: string | null,
  ) => Promise<{ success: boolean; reason?: "already-voted" | "error" }>;
  resetRankingPoints: () => Promise<void>;
  restoreOfficialRanking: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>(initialAthletes);
  const [customEmblems, setCustomEmblems] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [ranking, setRanking] = useState<RankingEntry[]>(() => {
    const sorted = [...initialRanking].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.course.localeCompare(b.course);
    });
    return sorted.map((e, idx) => ({ ...e, rank: idx + 1 }));
  });
  const [featuredAthletes, setFeaturedAthletes] = useState<FeaturedAthlete[]>([]);
  const [mvpCandidates, setMvpCandidates] = useState<MatchMvpCandidate[]>([]);
  const [mvpVotes, setMvpVotes] = useState<MatchMvpVote[]>([]);

  const isSavingRef = useRef(false);
  const isSavingCoursesRef = useRef(false);
  const pendingMatchIdsRef = useRef<Set<string>>(new Set());
  // IDs de partidas que foram atualizadas recentemente — polling não sobrescreve
  const savingMatchIdsRef = useRef<Set<string>>(new Set());
  const latestCoursesRef = useRef<string[]>([]);

  const normalizeInstitution = useCallback((name: string) => {
    if (!name) return name;
    return name.replace(/ESAMC/gi, "Esamc");
  }, []);

  // ── Polling — lê do backend (que lê do Supabase com service role) ────────────
  useEffect(() => {
    const fetchData = async () => {
      if (isSavingRef.current) return;
      try {
        // Matches
        const matchesData = await matchesApi.getAll() as any[];
        if (matchesData) {
          const fetchedMatches: Match[] = matchesData.map((m: any) => ({
            id: m.id,
            teamA: { id: m.teamA?.id, name: m.teamA?.name, course: m.teamA?.course, faculty: m.teamA?.faculty },
            teamB: { id: m.teamB?.id, name: m.teamB?.name, course: m.teamB?.course, faculty: m.teamB?.faculty },
            scoreA: m.scoreA,
            scoreB: m.scoreB,
            sport: m.sport,
            category: m.category,
            stage: m.stage,
            status: m.status,
            date: m.date,
            time: m.time,
            location: m.location,
            events: m.events || [],
            participants: m.participants || [],
            mvpVotingStartedAt: m.mvpVotingStartedAt || undefined,
          }));
          const fetchedIds = new Set(fetchedMatches.map((m) => m.id));
          setMatches((prev) => {
            // Mantém versão local de partidas que estão sendo editadas agora
            const localEditing = prev.filter((m) => savingMatchIdsRef.current.has(m.id));
            const localEditingIds = new Set(localEditing.map((m) => m.id));
            // Mantém partidas pendentes (criadas mas ainda não confirmadas pelo backend)
            const pending = prev.filter(
              (m) => pendingMatchIdsRef.current.has(m.id) && !fetchedIds.has(m.id),
            );
            // Filtra do backend as partidas que estão sendo editadas localmente
            const fromBackend = fetchedMatches.filter((m) => !localEditingIds.has(m.id));
            return [...pending, ...localEditing, ...fromBackend];
          });
        }

        // Courses
        let fetchedCourses: string[] = [];
        if (!isSavingCoursesRef.current) {
          const coursesData = await coursesApi.getAll() as any[];
          if (coursesData) {
            const nextEmblems: Record<string, string> = {};
            fetchedCourses = coursesData.map((c: any) => {
              const fullCourseString = normalizeInstitution(`${c.name} - ${c.university}`);
              if (c.emblem_url && c.emblem_url.startsWith("data:image")) {
                nextEmblems[fullCourseString] = c.emblem_url;
              }
              return fullCourseString;
            });
            const sortedCourses = fetchedCourses.sort((a, b) => a.localeCompare(b));
            setCustomEmblems((prev) => ({ ...prev, ...nextEmblems }));
            latestCoursesRef.current = sortedCourses;
            setCourses(sortedCourses);
          } else {
            fetchedCourses = latestCoursesRef.current;
          }
        } else {
          fetchedCourses = latestCoursesRef.current;
        }

        // Athletes
        const athletesData = await athletesApi.getAll() as any[];
        if (athletesData) {
          setAthletes(
            athletesData.map((a: any) => ({
              id: a.id,
              firstName: a.firstName,
              lastName: a.lastName,
              institution: normalizeInstitution(a.institution),
              course: a.course,
              sports: a.sports,
              sex: a.sex,
            })),
          );
        }

        // Ranking
        const rankingData = await rankingApi.getAll() as any[];
        if (rankingData) {
          const rankingMap = new Map<string, number>();
          rankingData.forEach((r: any) => rankingMap.set(r.course, r.points || 0));
          const reconciledRanking = fetchedCourses.map((c) => ({
            course: c,
            points: rankingMap.get(c) || 0,
          }));
          reconciledRanking.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.course.localeCompare(b.course);
          });
          setRanking(reconciledRanking.map((e, idx) => ({ ...e, rank: idx + 1 })));
        }

        // Featured Athletes
        const featuredData = await featuredAthletesApi.getAll() as any[];
        if (featuredData) {
          setFeaturedAthletes(
            featuredData.map((a: any) => ({
              id: a.id,
              name: a.name,
              institution: a.institution,
              course: a.course,
              sport: a.sport,
              reason: a.reason,
            })),
          );
        }

        // MVP Candidates
        const mvpData = await mvpApi.getCandidates() as any[];
        if (mvpData) {
          setMvpCandidates(
            mvpData.map((row: any) => ({
              id: row.id,
              matchId: row.matchId,
              sport: row.sport,
              playerName: row.playerName,
              teamId: row.teamId,
              teamName: row.teamName,
              institution: row.institution,
              course: row.course,
              points: row.points || 0,
              votes: row.votes || 0,
            })),
          );
        }

        // MVP Votes
        const mvpVotesData = await mvpApi.getVotes() as any[];
        if (mvpVotesData) {
          setMvpVotes(
            mvpVotesData.map((row: any) => ({
              id: row.id,
              matchId: row.matchId,
              candidateId: row.candidateId,
              voterUserId: row.voterUserId,
              voterEmail: row.voterEmail || null,
            })),
          );
        }
      } catch (error) {
        console.error("[DataContext] Erro no polling:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [normalizeInstitution]);

  // ── Courses ──────────────────────────────────────────────────────────────────

  const addCourse = async (course: string, emblem_url?: string) => {
    const [name, university] = course.split(" - ");
    isSavingCoursesRef.current = true;
    setCourses((prev) => {
      const next = [...prev, course].sort((a, b) => a.localeCompare(b));
      latestCoursesRef.current = next;
      return next;
    });
    try {
      await coursesApi.create({ id: crypto.randomUUID(), name, university, emblem_url });
    } catch (err) {
      console.error("[DataContext] Erro ao criar curso:", err);
    }
    setTimeout(() => { isSavingCoursesRef.current = false; }, 4000);
  };

  const removeCourse = async (courseToRemove: string) => {
    const [name, university] = courseToRemove.split(" - ");
    const [courseName] = courseToRemove.split(" - ");
    isSavingCoursesRef.current = true;
    setCourses((prev) => {
      const next = prev.filter((c) => c !== courseToRemove);
      latestCoursesRef.current = next;
      return next;
    });
    setAthletes((prev) => prev.filter((a) => a.course !== courseName));
    try {
      await coursesApi.delete(name, university);
    } catch (err) {
      console.error("[DataContext] Erro ao remover curso:", err);
    }
    setTimeout(() => { isSavingCoursesRef.current = false; }, 4000);
  };

  // ── Athletes ─────────────────────────────────────────────────────────────────

  const addAthlete = async (athlete: Athlete) => {
    setAthletes((prev) => [athlete, ...prev]);
    try {
      await athletesApi.create(athlete);
    } catch (err) {
      console.error("[DataContext] Erro ao criar atleta:", err);
    }
  };

  const removeAthlete = async (id: string) => {
    setAthletes((prev) => prev.filter((a) => a.id !== id));
    try {
      await athletesApi.delete(id);
    } catch (err) {
      console.error("[DataContext] Erro ao remover atleta:", err);
    }
  };

  // ── Featured Athletes ─────────────────────────────────────────────────────────

  const addFeaturedAthlete = async (athlete: FeaturedAthlete) => {
    setFeaturedAthletes((prev) => [athlete, ...prev]);
    try {
      await featuredAthletesApi.create(athlete);
    } catch (err) {
      console.error("[DataContext] Erro ao criar atleta em destaque:", err);
    }
  };

  const removeFeaturedAthlete = async (id: string) => {
    setFeaturedAthletes((prev) => prev.filter((a) => a.id !== id));
    try {
      await featuredAthletesApi.delete(id);
    } catch (err) {
      console.error("[DataContext] Erro ao remover atleta em destaque:", err);
    }
  };

  // ── Matches ───────────────────────────────────────────────────────────────────

  const addMatch = async (match: Match) => {
    pendingMatchIdsRef.current.add(match.id);
    setMatches((prev) => [match, ...prev]);
    isSavingRef.current = true;
    try {
      await matchesApi.create(match);
      pendingMatchIdsRef.current.delete(match.id);
    } catch (err) {
      console.error("[DataContext] Erro ao criar partida:", err);
    } finally {
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    }
  };

  const updateMatch = async (updatedMatch: Match) => {
    // Atualiza estado local imediatamente
    setMatches((prev) => prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)));
    // Marca esta partida como "em edição" — polling não vai sobrescrever
    savingMatchIdsRef.current.add(updatedMatch.id);
    isSavingRef.current = true;
    try {
      await matchesApi.update(updatedMatch.id, updatedMatch);
    } catch (err) {
      console.error("[DataContext] Erro ao atualizar partida:", err);
    } finally {
      // Aguarda 6s para o worker processar e o próximo poll buscar o dado correto
      setTimeout(() => {
        savingMatchIdsRef.current.delete(updatedMatch.id);
        isSavingRef.current = false;
      }, 6000);
    }
  };

  const deleteMatch = async (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
    try {
      await matchesApi.delete(id);
    } catch (err) {
      console.error("[DataContext] Erro ao deletar partida:", err);
    }
  };

  const deleteScheduledMatches = async () => {
    setMatches((prev) => prev.filter((m) => m.status !== "scheduled"));
    try {
      await matchesApi.deleteScheduled();
    } catch (err) {
      console.error("[DataContext] Erro ao deletar partidas agendadas:", err);
    }
  };

  // ── Ranking ───────────────────────────────────────────────────────────────────

  const updateRankingPoints = useCallback(
    async (course: string, newPoints: number) => {
      const updated = ranking.map((entry) =>
        entry.course === course ? { ...entry, points: newPoints } : entry,
      );
      updated.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.course.localeCompare(b.course);
      });
      setRanking(updated.map((entry, idx) => ({ ...entry, rank: idx + 1 })));
      try {
        await rankingApi.update(course, newPoints);
      } catch (err) {
        console.error("[DataContext] Erro ao atualizar ranking:", err);
      }
    },
    [ranking],
  );

  const resetRankingPoints = useCallback(async () => {
    setRanking((prev) => prev.map((entry, idx) => ({ ...entry, points: 0, rank: idx + 1 })));
    try {
      await rankingApi.reset();
    } catch (err) {
      console.error("[DataContext] Erro ao zerar ranking:", err);
    }
  }, []);

  const restoreOfficialRanking = useCallback(async () => {
    const official = [...initialRanking].map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    setRanking(official);
    try {
      await rankingApi.restore();
    } catch (err) {
      console.error("[DataContext] Erro ao restaurar ranking:", err);
    }
  }, []);

  // ── MVP ───────────────────────────────────────────────────────────────────────

  const ensureMatchMvpCandidates = async (candidates: MatchMvpCandidateInput[]): Promise<boolean> => {
    if (candidates.length === 0) return false;
    try {
      await mvpApi.ensureCandidates(candidates);
      return true;
    } catch (err) {
      console.error("[DataContext] Erro ao sincronizar candidatos MVP:", err);
      return false;
    }
  };

  const hasUserVotedMatch = (matchId: string, voterUserId: string, voterEmail?: string | null) => {
    const normalizedUserId = (voterUserId || "").trim().toLowerCase();
    const normalizedEmail = (voterEmail || "").trim().toLowerCase();
    return mvpVotes.some((vote) => {
      if (vote.matchId !== matchId) return false;
      const voteUserId = (vote.voterUserId || "").trim().toLowerCase();
      const voteEmail = (vote.voterEmail || "").trim().toLowerCase();
      if (normalizedUserId && voteUserId && normalizedUserId === voteUserId) return true;
      if (normalizedEmail && voteEmail && normalizedEmail === voteEmail) return true;
      return false;
    });
  };

  const voteMatchMvpCandidate = async (
    candidateId: string,
    currentVotes: number,
    matchId: string,
    voterUserId: string,
    voterEmail?: string | null,
  ): Promise<{ success: boolean; reason?: "already-voted" | "error" }> => {
    const normalizedUserId = (voterUserId || "").trim();
    if (!normalizedUserId) return { success: false, reason: "error" };

    if (hasUserVotedMatch(matchId, normalizedUserId, voterEmail || null)) {
      return { success: false, reason: "already-voted" };
    }

    try {
      const res = await mvpApi.vote(candidateId, currentVotes, matchId);
      if (!res.success) return { success: false, reason: res.reason };

      const nextVotes = currentVotes + 1;
      if (res.vote) {
        const v = res.vote as any;
        setMvpVotes((prev) => [
          {
            id: v.id,
            matchId: v.matchId,
            candidateId: v.candidateId,
            voterUserId: v.voterUserId,
            voterEmail: v.voterEmail || null,
          },
          ...prev,
        ]);
      }
      setMvpCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, votes: nextVotes } : c)),
      );
      return { success: true };
    } catch (err: any) {
      if (err?.status === 409) return { success: false, reason: "already-voted" };
      console.error("[DataContext] Erro ao votar MVP:", err);
      return { success: false, reason: "error" };
    }
  };

  const addCustomEmblem = (course: string, base64: string) => {
    setCustomEmblems((prev) => ({ ...prev, [course]: base64 }));
  };

  return (
    <DataContext.Provider
      value={{
        courses,
        addCourse,
        removeCourse,
        athletes,
        addAthlete,
        removeAthlete,
        customEmblems,
        addCustomEmblem,
        matches,
        addMatch,
        updateMatch,
        deleteMatch,
        deleteScheduledMatches,
        ranking,
        updateRankingPoints,
        resetRankingPoints,
        restoreOfficialRanking,
        featuredAthletes,
        addFeaturedAthlete,
        removeFeaturedAthlete,
        mvpCandidates,
        mvpVotes,
        ensureMatchMvpCandidates,
        hasUserVotedMatch,
        voteMatchMvpCandidate,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
