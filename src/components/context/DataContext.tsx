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
import { supabase } from "../../services/supabaseClient";

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
  addCourse: (course: string) => void;
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [courses, setCourses] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>(initialAthletes);
  const [customEmblems, setCustomEmblems] = useState<Record<string, string>>(
    {},
  );
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
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const isSavingCoursesRef = useRef(false);
  const pendingMatchIdsRef = useRef<Set<string>>(new Set());

  // Normalization helper for institutions (specifically ESAMC)
  const normalizeInstitution = useCallback((name: string) => {
    if (!name) return name;
    // Specifically handle ESAMC variations case-insensitively
    const normalized = name.replace(/ESAMC/gi, "Esamc");
    return normalized;
  }, []);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  // Supabase Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      if (isSavingRef.current) return; // Não sobrescreve o estado local enquanto uma gravação está em curso
      try {
        // Fetch Matches
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("*")
          .order("created_at", { ascending: false });

        if (matchesData && !matchesError && !isSavingRef.current) {
          const fetchedMatches = matchesData.map((m: any) => ({
            id: m.id,
            teamA: {
              id: m.team_a_id,
              name: m.team_a_name,
              course: m.team_a_course,
              faculty: m.team_a_faculty,
            },
            teamB: {
              id: m.team_b_id,
              name: m.team_b_name,
              course: m.team_b_course,
              faculty: m.team_b_faculty,
            },
            scoreA: m.score_a,
            scoreB: m.score_b,
            sport: m.sport,
            category: m.category,
            stage: m.stage,
            status: m.status,
            date: m.date,
            time: m.time,
            location: m.location,
            events: m.events || [],
            participants: m.participants || [],
            mvpVotingStartedAt: m.mvp_voting_started_at || undefined,
          }));
          const fetchedIds = new Set(fetchedMatches.map((m: Match) => m.id));

          setMatches((prev) => {
            const pending = prev.filter(
              (m) =>
                pendingMatchIdsRef.current.has(m.id) && !fetchedIds.has(m.id),
            );
            return [...pending, ...fetchedMatches];
          });
        }

        // Fetch Courses — substitui completamente pelo banco (fonte da verdade)
        // Guard: não sobrescreve durante add/remove de curso
        if (!isSavingCoursesRef.current) {
          const { data: coursesData, error: coursesError } = await supabase
            .from("courses")
            .select("*");
          if (coursesData && !coursesError) {
            const formattedCourses = coursesData.map((c) =>
              normalizeInstitution(`${c.name} - ${c.university}`),
            );
            setCourses(formattedCourses);
          }
        }

        // Fetch Athletes
        const { data: athletesData, error: athletesError } = await supabase
          .from("athletes")
          .select("*");
        if (athletesData && !athletesError) {
          setAthletes(
            athletesData.map((a) => ({
              id: a.id,
              firstName: a.first_name,
              lastName: a.last_name,
              institution: normalizeInstitution(a.institution),
              course: a.course,
              sports: a.sports,
              sex: a.sex,
            })),
          );
        }

        // Fetch Ranking
        const { data: rankingData, error: rankingError } = await supabase
          .from("ranking")
          .select("*")
          .order("points", { ascending: false })
          .order("course", { ascending: true });
        if (rankingData && !rankingError) {
          const ranked = rankingData.map((e: any, idx: number) => ({ ...e, rank: idx + 1 }));
          setRanking(ranked);
        }

        // Fetch Featured Athletes
        const { data: featuredData, error: featuredError } = await supabase
          .from("featured_athletes")
          .select("*")
          .order("created_at", { ascending: false });
        if (featuredData && !featuredError) {
          setFeaturedAthletes(
            featuredData.map((a: any) => ({
              id: a.id,
              name: a.name,
              institution: a.institution,
              course: a.course,
              sport: a.sport,
              reason: a.reason,
            }))
          );
        }

        const { data: mvpData, error: mvpError } = await supabase
          .from("match_mvp_candidates")
          .select("*")
          .order("created_at", { ascending: false });
        if (mvpData && !mvpError) {
          setMvpCandidates(
            mvpData.map((row: any) => ({
              id: row.id,
              matchId: row.match_id,
              sport: row.sport,
              playerName: row.player_name,
              teamId: row.team_id,
              teamName: row.team_name,
              institution: row.institution,
              course: row.course,
              points: row.points || 0,
              votes: row.votes || 0,
            })),
          );
        }

        const { data: mvpVotesData, error: mvpVotesError } = await supabase
          .from("match_mvp_votes")
          .select("*")
          .order("created_at", { ascending: false });
        if (mvpVotesData && !mvpVotesError) {
          setMvpVotes(
            mvpVotesData.map((row: any) => ({
              id: row.id,
              matchId: row.match_id,
              candidateId: row.candidate_id,
              voterUserId: row.voter_user_id,
              voterEmail: row.voter_email || null,
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Polling para atualizações em tempo real (a cada 3 segundos)
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  const addCourse = async (course: string) => {
    const [name, university] = course.split(" - ");
    isSavingCoursesRef.current = true;
    setCourses((prev) => [course, ...prev]);
    const { error } = await supabase.from("courses").insert([{ id: crypto.randomUUID(), name, university }]);
    if (error) console.error("Erro ao cadastrar curso no Supabase:", error);
    // Aguarda o próximo ciclo de polling propagar e então libera
    setTimeout(() => { isSavingCoursesRef.current = false; }, 4000);
  };

  const removeCourse = async (courseToRemove: string) => {
    const [name, university] = courseToRemove.split(" - ");
    isSavingCoursesRef.current = true;
    setCourses((prev) => prev.filter((c) => c !== courseToRemove));
    const [courseName] = courseToRemove.split(" - ");
    setAthletes((prev) => prev.filter((a) => a.course !== courseName));
    await supabase.from("courses").delete().match({ name, university });
    // Aguarda o próximo ciclo de polling propagar e então libera
    setTimeout(() => { isSavingCoursesRef.current = false; }, 4000);
  };

  const addAthlete = async (athlete: Athlete) => {
    setAthletes((prev) => [athlete, ...prev]);
    await supabase.from("athletes").insert([
      {
        id: athlete.id,
        first_name: athlete.firstName,
        last_name: athlete.lastName,
        institution: athlete.institution,
        course: athlete.course,
        sports: athlete.sports,
        sex: athlete.sex,
      },
    ]);
  };

  const removeAthlete = async (id: string) => {
    setAthletes((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("athletes").delete().match({ id });
  };

  const addFeaturedAthlete = async (athlete: FeaturedAthlete) => {
    setFeaturedAthletes((prev) => [athlete, ...prev]);
    await supabase.from("featured_athletes").insert([
      {
        id: athlete.id,
        name: athlete.name,
        institution: athlete.institution,
        course: athlete.course,
        sport: athlete.sport,
        reason: athlete.reason,
      },
    ]);
  };

  const removeFeaturedAthlete = async (id: string) => {
    setFeaturedAthletes((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("featured_athletes").delete().match({ id });
  };

  const ensureMatchMvpCandidates = async (
    candidates: MatchMvpCandidateInput[],
  ): Promise<boolean> => {
    if (candidates.length === 0) return false;

    const uniqueCandidates = Array.from(
      new Map(
        candidates.map((candidate) => [
          `${candidate.matchId}::${candidate.teamId}::${candidate.playerName.toLowerCase()}`,
          candidate,
        ]),
      ).values(),
    );

    const payload = uniqueCandidates.map((candidate) => ({
      match_id: candidate.matchId,
      sport: candidate.sport,
      player_name: candidate.playerName,
      team_id: candidate.teamId,
      team_name: candidate.teamName,
      institution: candidate.institution,
      course: candidate.course,
      points: candidate.points,
    }));

    const { error } = await supabase
      .from("match_mvp_candidates")
      .upsert(payload, {
        onConflict: "match_id,player_name,team_id",
      });

    if (error) {
      // Some environments may not have the unique index required for onConflict.
      // In this case, fallback to plain insert and continue with best-effort sync.
      const upsertNeedsConstraint =
        (error.message || "")
          .toLowerCase()
          .includes("no unique or exclusion constraint");

      if (!upsertNeedsConstraint) {
        console.error("Error ensuring MVP candidates:", error);
        return false;
      }

      const { error: insertError } = await supabase
        .from("match_mvp_candidates")
        .insert(payload);

      if (insertError) {
        console.error("Error inserting MVP candidates (fallback):", insertError);
        return false;
      }
    }

    const matchIds = new Set(uniqueCandidates.map((candidate) => candidate.matchId));
    const { data, error: refetchError } = await supabase
      .from("match_mvp_candidates")
      .select("*")
      .in("match_id", Array.from(matchIds));

    if (refetchError || !data) {
      if (refetchError) console.error("Error reloading MVP candidates:", refetchError);
      const fallbackMapped = uniqueCandidates.map((candidate) => ({
        id: `local-${candidate.matchId}-${candidate.teamId}-${candidate.playerName}`,
        matchId: candidate.matchId,
        sport: candidate.sport,
        playerName: candidate.playerName,
        teamId: candidate.teamId,
        teamName: candidate.teamName,
        institution: candidate.institution,
        course: candidate.course,
        points: candidate.points,
        votes: 0,
      }));

      setMvpCandidates((prev) => {
        const next = prev.filter((item) => !matchIds.has(item.matchId));
        return [...fallbackMapped, ...next];
      });

      return true;
    }

    const mapped = data.map((row: any) => ({
      id: row.id,
      matchId: row.match_id,
      sport: row.sport,
      playerName: row.player_name,
      teamId: row.team_id,
      teamName: row.team_name,
      institution: row.institution,
      course: row.course,
      points: row.points || 0,
      votes: row.votes || 0,
    }));

    setMvpCandidates((prev) => {
      const next = prev.filter((item) => !matchIds.has(item.matchId));
      return [...mapped, ...next];
    });

    return true;
  };

  const hasUserVotedMatch = (
    matchId: string,
    voterUserId: string,
    voterEmail?: string | null,
  ) => {
    const normalizedUserId = (voterUserId || "").trim().toLowerCase();
    const normalizedEmail = (voterEmail || "").trim().toLowerCase();

    return mvpVotes.some((vote) => {
      if (vote.matchId !== matchId) return false;

      const voteUserId = (vote.voterUserId || "").trim().toLowerCase();
      const voteEmail = (vote.voterEmail || "").trim().toLowerCase();

      if (normalizedUserId && voteUserId && normalizedUserId === voteUserId) {
        return true;
      }

      if (normalizedEmail && voteEmail && normalizedEmail === voteEmail) {
        return true;
      }

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
    const normalizedEmail = (voterEmail || "").trim().toLowerCase();

    if (!normalizedUserId) {
      return { success: false, reason: "error" };
    }

    if (hasUserVotedMatch(matchId, normalizedUserId, normalizedEmail || null)) {
      return { success: false, reason: "already-voted" };
    }

    const { data: voteInsert, error: voteInsertError } = await supabase
      .from("match_mvp_votes")
      .insert([
        {
          match_id: matchId,
          candidate_id: candidateId,
          voter_user_id: normalizedUserId,
          voter_email: normalizedEmail || null,
        },
      ])
      .select("*")
      .single();

    if (voteInsertError) {
      const duplicate =
        voteInsertError.code === "23505" ||
        voteInsertError.message.toLowerCase().includes("duplicate");

      if (duplicate) {
        return { success: false, reason: "already-voted" };
      }

      console.error("Error inserting MVP vote:", voteInsertError);
      return { success: false, reason: "error" };
    }

    const nextVotes = currentVotes + 1;
    const { error } = await supabase
      .from("match_mvp_candidates")
      .update({ votes: nextVotes })
      .eq("id", candidateId);

    if (error) {
      console.error("Error updating MVP vote:", error);
      return { success: false, reason: "error" };
    }

    setMvpVotes((prev) => [
      {
        id: voteInsert.id,
        matchId: voteInsert.match_id,
        candidateId: voteInsert.candidate_id,
        voterUserId: voteInsert.voter_user_id,
        voterEmail: voteInsert.voter_email || null,
      },
      ...prev,
    ]);

    setMvpCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, votes: nextVotes }
          : candidate,
      ),
    );

    return { success: true };
  };

  const addCustomEmblem = (course: string, base64: string) => {
    setCustomEmblems((prev) => ({ ...prev, [course]: base64 }));
  };

  const addMatch = async (match: Match) => {
    pendingMatchIdsRef.current.add(match.id);
    setMatches((prev) => [match, ...prev]);
    setIsSaving(true);

    try {
      const { error } = await supabase.from("matches").insert([
        {
          id: match.id,
          team_a_id: match.teamA.id,
          team_a_name: match.teamA.name,
          team_a_course: match.teamA.course,
          team_a_faculty: match.teamA.faculty,
          team_b_id: match.teamB.id,
          team_b_name: match.teamB.name,
          team_b_course: match.teamB.course,
          team_b_faculty: match.teamB.faculty,
          score_a: match.scoreA,
          score_b: match.scoreB,
          sport: match.sport,
          category: match.category,
          stage: match.stage, // <-- Adicionado para salvar a fase
          status: match.status,
          date: match.date,
          time: match.time,
          location: match.location,
          events: match.events || [],
          participants: match.participants || [],
        },
      ]);

      if (error) {
        console.error("Error inserting match in Supabase:", error);
        // Notifique o usuário no componente de tela, se necessário
        // Exemplo: set um erro no estado e exiba no componente
        // Aqui apenas loga o erro
        return;
      }

      pendingMatchIdsRef.current.delete(match.id);
    } finally {
      setTimeout(() => setIsSaving(false), 2000);
    }
  };

  const updateMatch = async (updatedMatch: Match) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)),
    );
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("matches")
        .update({
          score_a: updatedMatch.scoreA,
          score_b: updatedMatch.scoreB,
          status: updatedMatch.status,
          date: updatedMatch.date,
          time: updatedMatch.time,
          location: updatedMatch.location,
          events: updatedMatch.events || [],
          participants: updatedMatch.participants || [],
          stage: updatedMatch.stage,
          mvp_voting_started_at: updatedMatch.mvpVotingStartedAt || null,
        })
        .match({ id: updatedMatch.id });

      if (error) {
        console.error("Error updating match in Supabase:", error);
      }
    } finally {
      // Pequeno delay para garantir que o próximo fetch pegue os dados novos
      setTimeout(() => setIsSaving(false), 2000);
    }
  };

  const deleteMatch = async (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("matches").delete().match({ id });
  };

  const updateRankingPoints = useCallback(
    async (course: string, newPoints: number) => {
      const updated = ranking.map((entry) =>
        entry.course === course ? { ...entry, points: newPoints } : entry,
      );
      // Sort: points descending, then alphabetical on tie
      updated.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.course.localeCompare(b.course);
      });
      // Re-assign ranks
      const updatedRanking = updated.map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
      setRanking(updatedRanking);

      // Sync with Supabase (UPDATE)
      const entry = updatedRanking.find((e) => e.course === course);
      if (entry) {
        const { error } = await supabase
          .from("ranking")
          .update({
            points: entry.points
          })
          .eq("course", entry.course);
          
        if (error) console.error("Erro na atualização do ranking:", error);
      }
    },
    [ranking],
  );

  const resetRankingPoints = useCallback(async () => {
    const reset = ranking.map((entry, index) => ({
      ...entry,
      points: 0,
      rank: index + 1
    }));
    setRanking(reset);

    const { error } = await supabase
      .from("ranking")
      .update({ points: 0 })
      .neq("course", "xyz_never_match_this"); // atualiza todos

    if (error) console.error("Error resetting points:", error);
  }, [ranking]);

  const restoreOfficialRanking = useCallback(async () => {
    // 1. Atualizar Local
    const official = [...initialRanking].map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    setRanking(official);

    // 2. Atualizar Banco de Dados
    const updatePromises = official.map((entry) => 
      supabase
        .from("ranking")
        .update({ points: entry.points })
        .eq("course", entry.course)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
      console.error("Erro ao restaurar a pontuação oficial:", errors);
    }
  }, []);

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
