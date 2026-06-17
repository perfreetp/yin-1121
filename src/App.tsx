import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { RulesList } from "@/pages/Rules";
import { RulesDetail } from "@/pages/Rules/Detail";
import { PracticeList } from "@/pages/Practice";
import { PracticeSession } from "@/pages/Practice/Session";
import { LevelsList } from "@/pages/Levels";
import { LevelSession } from "@/pages/Levels/Session";
import { MistakesList } from "@/pages/Mistakes";
import { MistakesAnalysis } from "@/pages/Mistakes/Analysis";
import { ProfilePage } from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* 规则课堂 */}
        <Route path="/rules" element={<RulesList />} />
        <Route path="/rules/:id" element={<RulesDetail />} />
        
        {/* 案例演练 */}
        <Route path="/practice" element={<PracticeList />} />
        <Route path="/practice/knowledge/:knowledgeId" element={<PracticeList />} />
        <Route path="/practice/session" element={<PracticeSession />} />
        
        {/* 闯关审校 */}
        <Route path="/levels" element={<LevelsList />} />
        <Route path="/levels/:id" element={<LevelSession />} />
        
        {/* 错题本 */}
        <Route path="/mistakes" element={<MistakesList />} />
        <Route path="/mistakes/analysis" element={<MistakesAnalysis />} />
        
        {/* 成绩面板 */}
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* 404 */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
