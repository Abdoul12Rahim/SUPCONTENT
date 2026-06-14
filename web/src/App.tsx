import { Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';
import { Header } from './components/Layout/Header';
import { Home } from './pages/Home';
import { Games } from './pages/Games';
import { ContentPage } from './pages/ContentPage';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Feed } from './pages/Feed';
import { Library } from './pages/Library';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { CommunityReviews } from './pages/CommunityReviews';
import { UserProfile } from './pages/UserProfile';
import { Discover } from './pages/Discover';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { Achievements } from './pages/Achievements';
import { CollaborativeListsPage } from './pages/CollaborativeLists';
import { CollaborativeListDetail } from './pages/CollaborativeListDetail';
import { JoinCollaborativeList } from './pages/JoinCollaborativeList';
import { PersonalListDetail } from './pages/PersonalListDetail';
import { ReviewDetail } from './pages/ReviewDetail';
import { Rooms } from './pages/Rooms';
import { AchievementListener } from './components/Common/AchievementListener';
import { BottomNav } from './components/Layout/BottomNav';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <AchievementListener />
            <Box minH="100vh" bg="ui.bg" pb={{ base: '72px', md: 0 }}>
              <Header />
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/games" element={<Games />} />
              <Route path="/game/:slug" element={<ContentPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/reviews" element={<CommunityReviews />} />
              <Route path="/review/:reviewId" element={<ReviewDetail />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/collaborative-lists" element={<CollaborativeListsPage />} />
              <Route path="/collaborative-lists/join/:inviteCode" element={<JoinCollaborativeList />} />
              <Route path="/collaborative-lists/:listId" element={<CollaborativeListDetail />} />
              <Route path="/library" element={<Library />} />
              <Route path="/list/:listId" element={<PersonalListDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Home />} />
            </Routes>
            <BottomNav />
          </Box>
        </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
