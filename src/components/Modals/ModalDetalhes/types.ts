import type { ReactNode } from 'react';

export interface ModalDetalhesProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: CourseData | null;
}

export interface CourseData {
  name: string;
  university: string;
  icon: ReactNode;
  emblemUrl: string | null;
}
