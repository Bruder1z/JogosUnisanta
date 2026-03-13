import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AVAILABLE_COURSES, mockAthletes as initialAthletes, mockMatches, mockRanking as initialRanking, type Match, type RankingEntry } from '../../data/mockData';
import { supabase } from '../../services/supabaseClient';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Carregar do localStorage e mesclar com AVAILABLE_COURSES para novos cursos ficarem visíveis
    const [courses, setCourses] = useState<string[]>(() => {
        // Legacy names that must never appear, regardless of what's in localStorage
        const DENY_LIST = [
            'Odonto São Judas',
            'Odontologia São Judas', // non-hyphen variant
            'Odonto - São Judas',
        ];

        const saved = localStorage.getItem('jg_courses');
        if (saved) {
            const savedCourses: string[] = JSON.parse(saved);
            // Start with the clean base list
            const result = [...AVAILABLE_COURSES];
            // Append only admin-added courses (not in the base, not denied)
            savedCourses.forEach(c => {
                if (!result.includes(c) && !DENY_LIST.includes(c)) {
                    result.push(c);
                }
            });
            return result;
        }
        return AVAILABLE_COURSES;
    });

    const [athletes, setAthletes] = useState<Athlete[]>(() => {
        const saved = localStorage.getItem('jg_athletes');
        if (saved) return JSON.parse(saved);
        return initialAthletes;
    });

    // Salvar sempre que houver alteração
    useEffect(() => {
        localStorage.setItem('jg_courses', JSON.stringify(courses));
    }, [courses]);

    useEffect(() => {
        localStorage.setItem('jg_athletes', JSON.stringify(athletes));
    }, [athletes]);

    const [customEmblems, setCustomEmblems] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('jg_emblems');
        if (saved) return JSON.parse(saved);
        return {};
    });

    const [matches, setMatches] = useState<Match[]>(() => {
        const saved = localStorage.getItem('jg_matches');
        if (saved) return JSON.parse(saved);
        return mockMatches;
    });

    const [ranking, setRanking] = useState<RankingEntry[]>(() => {
        const RANKING_DENY_LIST = [
            'Odonto São Judas',
            'Odontologia São Judas',
            'Odonto - São Judas',
        ];

        const saved = localStorage.getItem('jg_ranking');
        if (saved) {
            // Build a points map from saved data (admin edits), filtering denied names
            const savedEntries: RankingEntry[] = (JSON.parse(saved) as RankingEntry[])
                .filter(e => !RANKING_DENY_LIST.includes(e.course));
            const savedPoints = new Map(savedEntries.map(e => [e.course, e.points]));

            // Start canonical from initialRanking, applying any admin-edited points
            const merged = initialRanking.map(e => ({
                ...e,
                points: savedPoints.has(e.course) ? savedPoints.get(e.course)! : e.points
            }));

            merged.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return a.course.localeCompare(b.course);
            });
            return merged.map((e, idx) => ({ ...e, rank: idx + 1 }));
        }
        // Fresh start: just return initialRanking sorted & ranked
        const sorted = [...initialRanking].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.course.localeCompare(b.course);
        });
        return sorted.map((e, idx) => ({ ...e, rank: idx + 1 }));
    });

    const [featuredAthletes, setFeaturedAthletes] = useState<FeaturedAthlete[]>(() => {
        const saved = localStorage.getItem('jg_featured');
        if (saved) return JSON.parse(saved);
        return [];
    });

    useEffect(() => {
        localStorage.setItem('jg_emblems', JSON.stringify(customEmblems));
    }, [customEmblems]);

    useEffect(() => {
        localStorage.setItem('jg_matches', JSON.stringify(matches));
    }, [matches]);

    useEffect(() => {
        localStorage.setItem('jg_ranking', JSON.stringify(ranking));
    }, [ranking]);

    useEffect(() => {
        localStorage.setItem('jg_featured', JSON.stringify(featuredAthletes));
    }, [featuredAthletes]);
    const [isSaving, setIsSaving] = useState(false);

    // Supabase Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            if (isSaving) return; // Não sobrescreve o estado local enquanto uma gravação está em curso
            try {
                // Fetch Matches
                const { data: matchesData, error: matchesError } = await supabase
                    .from('matches')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (matchesData && !matchesError && !isSaving) {
                    setMatches(matchesData.map((m: any) => ({
                        id: m.id,
                        teamA: { id: m.team_a_id, name: m.team_a_name, course: m.team_a_course, faculty: m.team_a_faculty },
                        teamB: { id: m.team_b_id, name: m.team_b_name, course: m.team_b_course, faculty: m.team_b_faculty },
                        scoreA: m.score_a,
                        scoreB: m.score_b,
                        sport: m.sport,
                        category: m.category,
                        status: m.status,
                        date: m.date,
                        time: m.time,
                        location: m.location,
                        events: m.events || []
                    })));
                }

                // Fetch Courses
                const { data: coursesData, error: coursesError } = await supabase
                    .from('courses')
                    .select('*');
                if (coursesData && !coursesError) {
                    const formattedCourses = coursesData.map(c => `${c.name} - ${c.university}`);
                    setCourses(prev => {
                        const merged = [...new Set([...prev, ...formattedCourses])];
                        return merged;
                    });
                }

                // Fetch Athletes
                const { data: athletesData, error: athletesError } = await supabase
                    .from('athletes')
                    .select('*');
                if (athletesData && !athletesError) {
                    setAthletes(athletesData.map(a => ({
                        id: a.id,
                        firstName: a.first_name,
                        lastName: a.last_name,
                        institution: a.institution,
                        course: a.course,
                        sports: a.sports
                    })));
                }

                // Fetch Ranking
                const { data: rankingData, error: rankingError } = await supabase
                    .from('ranking')
                    .select('*')
                    .order('rank', { ascending: true });
                if (rankingData && !rankingError) {
                    setRanking(rankingData);
                }
            } catch (error) {
                console.error('Error fetching matches:', error);
            }
        };

        fetchData();
        
        // Polling para atualizações em tempo real (a cada 3 segundos)
        const interval = setInterval(fetchData, 3000);
        
        return () => clearInterval(interval);
    }, []);

    const addCourse = async (course: string) => {
        const [name, university] = course.split(' - ');
        setCourses(prev => [course, ...prev]);
        await supabase.from('courses').insert([{ name, university }]);
    };

    const removeCourse = async (courseToRemove: string) => {
        const [name, university] = courseToRemove.split(' - ');
        setCourses(prev => prev.filter(c => c !== courseToRemove));
        const [courseName] = courseToRemove.split(' - ');
        setAthletes(prev => prev.filter(a => a.course !== courseName));
        
        await supabase.from('courses').delete().match({ name, university });
    };

    const addAthlete = async (athlete: Athlete) => {
        setAthletes(prev => [athlete, ...prev]);
        await supabase.from('athletes').insert([{
            id: athlete.id,
            first_name: athlete.firstName,
            last_name: athlete.lastName,
            institution: athlete.institution,
            course: athlete.course,
            sports: athlete.sports
        }]);
    };

    const removeAthlete = async (id: string) => {
        setAthletes(prev => prev.filter(a => a.id !== id));
        await supabase.from('athletes').delete().match({ id });
    };

    const addCustomEmblem = (course: string, base64: string) => {
        setCustomEmblems(prev => ({ ...prev, [course]: base64 }));
    };

    const addMatch = async (match: Match) => {
        setMatches(prev => [match, ...prev]);
        
        await supabase.from('matches').insert([{
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
            events: match.events || []
        }]);
    };

    const updateMatch = async (updatedMatch: Match) => {
        setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
        setIsSaving(true);
        
        try {
            const { error } = await supabase.from('matches').update({
                score_a: updatedMatch.scoreA,
                score_b: updatedMatch.scoreB,
                status: updatedMatch.status,
                date: updatedMatch.date,
                time: updatedMatch.time,
                location: updatedMatch.location,
                events: updatedMatch.events || []
            }).match({ id: updatedMatch.id });

            if (error) {
                console.error('Error updating match in Supabase:', error);
            }
        } finally {
            // Pequeno delay para garantir que o próximo fetch pegue os dados novos
            setTimeout(() => setIsSaving(false), 2000);
        }
    };

    const deleteMatch = async (id: string) => {
        setMatches(prev => prev.filter(m => m.id !== id));
        await supabase.from('matches').delete().match({ id });
    };

    const updateRankingPoints = useCallback(async (course: string, newPoints: number) => {
        let updatedRanking: RankingEntry[] = [];
        setRanking(prev => {
            const updated = prev.map(entry =>
                entry.course === course ? { ...entry, points: newPoints } : entry
            );
            // Sort: points descending, then alphabetical on tie
            updated.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return a.course.localeCompare(b.course);
            });
            // Re-assign ranks
            updatedRanking = updated.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
            return updatedRanking;
        });

        // Sync with Supabase (UPSERT)
        const entry = updatedRanking.find(e => e.course === course);
        if (entry) {
            await supabase.from('ranking').upsert([{
                course: entry.course,
                points: entry.points,
                rank: entry.rank
            }]);
        }
    }, []);

    return (
        <DataContext.Provider value={{
            courses, addCourse, removeCourse,
            athletes, addAthlete, removeAthlete,
            customEmblems, addCustomEmblem,
            matches, addMatch, updateMatch, deleteMatch,
            ranking, updateRankingPoints,
            featuredAthletes,
            addFeaturedAthlete: (athlete: FeaturedAthlete) => setFeaturedAthletes(prev => [athlete, ...prev]),
            removeFeaturedAthlete: (id: string) => setFeaturedAthletes(prev => prev.filter(a => a.id !== id))
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
