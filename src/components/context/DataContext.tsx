import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  AVAILABLE_COURSES,
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
  addFeaturedAthlete: (athlete: FeaturedAthlete) => void;
  removeFeaturedAthlete: (id: string) => void;
  resetRankingPoints: () => Promise<void>;
  restoreOfficialRanking: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [courses, setCourses] = useState<string[]>(AVAILABLE_COURSES);
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
  const [featuredAthletes, setFeaturedAthletes] = useState<FeaturedAthlete[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
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
            status: m.status,
            date: m.date,
            time: m.time,
            location: m.location,
            events: m.events || [],
            participants: m.participants || [],
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

        // Fetch Courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*");
        if (coursesData && !coursesError) {
          const formattedCourses = coursesData.map((c) =>
            normalizeInstitution(`${c.name} - ${c.university}`),
          );
          setCourses((prev) => {
            const merged = [...new Set([...prev, ...formattedCourses])];
            return merged;
          });
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

        // Fetch Featured Athletes
        const { data: featuredData, error: featuredError } = await supabase
          .from("featured_athletes")
          .select("*");
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
      } catch (error) {
        console.error("Error fetching matches:", error);
      }
    };

    fetchData();

    // Polling para atualizações em tempo real (a cada 3 segundos)
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  const addCourse = async (course: string) => {
    const [name, university] = course.split(" - ");
    setCourses((prev) => [course, ...prev]);
    await supabase.from("courses").insert([{ name, university }]);
  };

  const removeCourse = async (courseToRemove: string) => {
    const [name, university] = courseToRemove.split(" - ");
    setCourses((prev) => prev.filter((c) => c !== courseToRemove));
    const [courseName] = courseToRemove.split(" - ");
    setAthletes((prev) => prev.filter((a) => a.course !== courseName));

    await supabase.from("courses").delete().match({ name, university });
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
        alert(
          "Nao foi possivel salvar a partida no banco. Verifique se a tabela matches tem a coluna participants.",
        );
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
