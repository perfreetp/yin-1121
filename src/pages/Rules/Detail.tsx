import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Star, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown,
  Scale,
  Lightbulb,
  FileText,
  PlayCircle
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { knowledgeList } from '@/data/knowledge';
import { getQuestionsByKnowledge } from '@/data/questions';
import { useLearningStore } from '@/store/useLearningStore';
import { cn } from '@/lib/utils';

export const RulesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { markAsLearned, learnedIds, favorites, toggleFavorite } = useLearningStore();
  const [activeTab, setActiveTab] = useState<'content' | 'examples' | 'questions'>('content');

  const knowledge = knowledgeList.find(k => k.id === id);
  const relatedQuestions = getQuestionsByKnowledge(id || '');
  const isLearned = learnedIds.includes(id || '');
  const isFavorite = favorites.some(
    f => f.targetType === 'knowledge' && f.targetId === id
  );

  if (!knowledge) {
    return (
      <PageLayout>
        <div className="p-6 lg:p-8">
          <button onClick={() => navigate('/rules')} className="btn-secondary mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </button>
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">知识点不存在</h3>
            <p className="text-slate-500">请从列表中选择有效的知识点</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const handleMarkAsLearned = () => {
    if (!isLearned) {
      markAsLearned(knowledge.id);
    }
  };

  const handleFavoriteClick = () => {
    toggleFavorite({
      targetType: 'knowledge',
      targetId: knowledge.id,
      targetTitle: knowledge.title,
      targetContent: knowledge.content,
    });
  };

  const handleStartPractice = () => {
    if (relatedQuestions.length > 0) {
      navigate(`/practice/knowledge/${knowledge.id}`);
    } else {
      navigate('/practice');
    }
  };

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Navigation */}
        <button 
          onClick={() => navigate('/rules')} 
          className="btn-secondary mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card p-6 mb-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-primary">{knowledge.categoryName}</span>
                    {isLearned && (
                      <span className="tag-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        已学习
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold font-display mb-2">{knowledge.title}</h1>
                  <p className="text-slate-500">{knowledge.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFavoriteClick}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isFavorite ? 'bg-accent-100 text-accent-600' : 'hover:bg-slate-100 text-slate-400'
                    )}
                    title={isFavorite ? '取消收藏' : '收藏'}
                  >
                    <Star className={cn('w-5 h-5', isFavorite && 'fill-current')} />
                  </button>
                  {!isLearned && (
                    <button
                      onClick={handleMarkAsLearned}
                      className="btn-success"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      标记已学习
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200 mb-6">
                {[
                  { value: 'content', label: '知识内容', icon: BookOpen },
                  { value: 'examples', label: '正反示例', icon: ThumbsUp },
                  { value: 'questions', label: '相关练习', icon: PlayCircle },
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value as typeof activeTab)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 border-b-2 -mb-px font-medium transition-colors',
                      activeTab === tab.value
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'content' && (
                <div className="animate-fade-in-up">
                  <div className="space-y-6">
                    <div className="p-4 bg-primary-50 rounded-xl">
                      <h3 className="font-semibold text-primary-800 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        核心要点
                      </h3>
                      <ul className="space-y-2">
                        {knowledge.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary-200 text-primary-700 flex items-center justify-center text-sm font-medium shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-primary-900">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        相关法规
                      </h3>
                      <ul className="space-y-2">
                        {knowledge.relatedLaws.map((law, index) => (
                          <li key={index} className="flex items-start gap-2 text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                            <div>
                              <span className="font-medium">{law.name}</span>
                              <span className="text-slate-500 ml-2">{law.article}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'examples' && (
                <div className="animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-success-50 border border-success-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsUp className="w-5 h-5 text-success-600" />
                        <h3 className="font-semibold text-success-800">正确示例</h3>
                      </div>
                      <div className="text-success-900 whitespace-pre-wrap text-sm leading-relaxed bg-white/50 p-4 rounded-lg">
                        {knowledge.goodExample}
                      </div>
                    </div>
                    <div className="p-5 bg-danger-50 border border-danger-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsDown className="w-5 h-5 text-danger-600" />
                        <h3 className="font-semibold text-danger-800">错误示例</h3>
                      </div>
                      <div className="text-danger-900 whitespace-pre-wrap text-sm leading-relaxed bg-white/50 p-4 rounded-lg">
                        {knowledge.badExample}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-accent-50 rounded-xl">
                    <h4 className="font-semibold text-accent-800 mb-2">💡 要点提示</h4>
                    <p className="text-accent-900 text-sm">
                      通过对比正反示例，可以清晰地看出规范的编制方法与常见错误的区别。
                      正确示例的特点是：明确、具体、可操作、无模糊表述；
                      错误示例通常存在：使用模糊词语、要素缺失、条件不合理等问题。
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="animate-fade-in-up">
                  {relatedQuestions.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-600">
                          共 <span className="font-semibold text-primary-600">{relatedQuestions.length}</span> 道相关练习题
                        </p>
                        <button onClick={handleStartPractice} className="btn-primary">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          开始练习
                        </button>
                      </div>
                      <div className="space-y-3">
                        {relatedQuestions.map((q, index) => (
                          <div key={q.id} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="tag-accent text-xs">{q.typeName}</span>
                                  <span className="tag-primary text-xs">{q.itemTypeName}</span>
                                </div>
                                <p className="text-sm text-slate-700 line-clamp-2">{q.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">暂无相关练习题</h3>
                      <p className="text-slate-500 mb-4">该知识点的练习题正在补充中</p>
                      <button onClick={() => navigate('/practice')} className="btn-secondary">
                        去练习其他知识点
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Learning Progress */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-4">学习进度</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary-600 mb-1">
                  {Math.round((learnedIds.length / knowledgeList.length) * 100)}%
                </div>
                <p className="text-sm text-slate-500">
                  {learnedIds.length}/{knowledgeList.length} 知识点
                </p>
              </div>
              <div className="progress-bar mb-4">
                <div className="progress-fill" style={{ width: `${(learnedIds.length / knowledgeList.length) * 100}%` }} />
              </div>
              <button
                onClick={handleStartPractice}
                className="btn-accent w-full"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                练习此知识点
              </button>
            </div>

            {/* Related Knowledge */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-4">相关知识点</h3>
              <div className="space-y-3">
                {knowledgeList
                  .filter(k => k.category === knowledge.category && k.id !== knowledge.id)
                  .slice(0, 3)
                  .map(k => (
                    <div
                      key={k.id}
                      onClick={() => navigate(`/rules/${k.id}`)}
                      className="p-3 rounded-lg bg-slate-50 hover:bg-primary-50 cursor-pointer transition-colors group"
                    >
                      <p className="text-sm font-medium text-slate-800 group-hover:text-primary-700 line-clamp-1">
                        {k.title}
                      </p>
                      {learnedIds.includes(k.id) && (
                        <span className="tag-success text-xs mt-1">已学习</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-5">
              <h3 className="font-semibold text-primary-800 mb-2">💡 学习建议</h3>
              <ul className="text-sm text-primary-900 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                  先阅读知识内容，理解核心要点
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                  对比正反示例，掌握规范写法
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                  完成相关练习，巩固学习成果
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                  收藏重点内容，便于复习回顾
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
