import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import Home from "./components/root/pages/home";
import Explore from "./components/root/pages/explore";
import Profile from "./components/root/pages/profile";
import Bookmarks from "./components/root/pages/bookmarks";
import Favorite from "./components/root/pages/favorites";
import PostViewer from "./components/root/pages/post-viewer";
import HashTag from "./components/root/pages/hashtag";
import Search from "./components/root/pages/search";
import Settings from "./components/root/settings";
import PrivacyPolicy from "./components/root/pages/privacy-policy";
import TermsAndConditions from "./components/root/pages/terms-and-conditions";
import Download from "./components/root/pages/download";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        {/* public routes */}
        <Route>
          <Route index path='/' element={<Home/>}/>
          <Route path='/sign-in' element={<SignIn/>}/>
          <Route path='/sign-up' element={<SignUp/>}/>
        </Route>

        {/* private routes */}
        <Route>
          <Route path='/search/:query' element={<Search/>}/>
          <Route path='/favorites' element={<Favorite/>}/>
          <Route path='/explore' element={<Explore/>}/>
          <Route path='/bookmarks' element={<Bookmarks/>}/>
          <Route path='/hashtag/:tag' element={<HashTag/>}/>
          <Route path='/post/:id' element={<PostViewer/>}/>
          <Route path='/:id' element={<Profile/>}/>
          <Route path='/settings' element={<Settings/>}/>
          <Route path='/settings/:page' element={<Settings/>}/>
          <Route path='/privacy-policy' element={<PrivacyPolicy/>}/>
          <Route path='/terms-and-conditions' element={<TermsAndConditions/>}/>
          <Route path='/download' element={<Download/>}/>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;