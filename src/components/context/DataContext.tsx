import React, { createContext, useContext, useState, useEffect } from 'react';
import { AVAILABLE_COURSES, mockAthletes as initialAthletes, mockMatches, type Match } from '../../data/mockData';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Carregar do localStorage e mesclar com AVAILABLE_COURSES para novos cursos ficarem visíveis
    const [courses, setCourses] = useState<string[]>(() => {
        const saved = localStorage.getItem('jg_courses');
        if (saved) {
            const savedCourses: string[] = JSON.parse(saved);
            // Merge: add any new courses from AVAILABLE_COURSES that aren't in saved list
            const merged = [...savedCourses];
            AVAILABLE_COURSES.forEach(c => {
                if (!merged.includes(c)) merged.push(c);
            });
            return merged;
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

    useEffect(() => {
        localStorage.setItem('jg_emblems', JSON.stringify(customEmblems));
    }, [customEmblems]);

    useEffect(() => {
        localStorage.setItem('jg_matches', JSON.stringify(matches));
    }, [matches]);

    const addCourse = (course: string) => setCourses(prev => [course, ...prev]);
    const removeCourse = (courseToRemove: string) => {
        setCourses(prev => prev.filter(c => c !== courseToRemove));

        // Também removemos atletas que pertencem a esse curso (Regra de Negócio)
        const [courseName] = courseToRemove.split(' - ');
        setAthletes(prev => prev.filter(a => a.course !== courseName));
    };

    const addAthlete = (athlete: Athlete) => setAthletes(prev => [athlete, ...prev]);
    const removeAthlete = (id: string) => setAthletes(prev => prev.filter(a => a.id !== id));

    const addCustomEmblem = (course: string, base64: string) => {
        setCustomEmblems(prev => ({ ...prev, [course]: base64 }));
    };

    const addMatch = (match: Match) => setMatches(prev => [match, ...prev]);
    const updateMatch = (updatedMatch: Match) => setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    const deleteMatch = (id: string) => setMatches(prev => prev.filter(m => m.id !== id));

    return (
        <DataContext.Provider value={{
            courses, addCourse, removeCourse,
            athletes, addAthlete, removeAthlete,
            customEmblems, addCustomEmblem,
            matches, addMatch, updateMatch, deleteMatch
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
