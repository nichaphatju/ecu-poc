import type { RouteObject } from 'react-router';
import AppLayout from '@/appLayout';
import Home from './pages/Home';
import Materials from './pages/Materials';
import LessonQuestions from './pages/LessonQuestions';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
        handle: { showInNavigation: true, label: 'Home' },
      },
      {
        path: 'materials',
        element: <Materials />,
        handle: { showInNavigation: true, label: 'Materials' },
      },
      {
        path: 'materials/:lessonId',
        element: <LessonQuestions />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
