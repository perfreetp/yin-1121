import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  FileCheck, 
  Download,
  BookOpen,
  ChevronRight,
  Target,
  Lightbulb,
  Home,
  RotateCcw,
  Lock,
  Unlock,
  Clock,
  Award,
  Copy,
  Check
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useLearningStore } from '@/store/useLearningStore';
import { getLevelById, levelList } from '@/data/levels';
import { checkAnswer, groupQuestionsByCategory, generateWeaknessSuggestions } from '@/utils/calculation';
import { knowledgeList } from '@/data/knowledge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/format';

export const LevelReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { questions, userAnswers, submittedQuestions, submissionResults, finalResult, reset } = usePracticeStore();
  const { levelProgress, user } = useLearningStore();
  const [copied, setCopied] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleExpanded = (idx: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const level = useMemo(() => {
    if (!id) return undefined;
    return getLevelById(parseInt(id));
  }, [id]);

  const currentProgress = useMemo(() => {
    if (!level) return undefined;
    return levelProgress.find(p => p.levelId === level.id);
  }, [level, levelProgress]);

  const score = finalResult?.score ?? currentProgress?.bestScore ?? 0;
  const isPassed = score >= (level?.passScore || 0);
  const timeSpent = finalResult?.timeSpent ?? currentProgress?.bestTime ?? 0;
  const attemptDate = currentProgress?.attemptDate || new Date().toISOString();

  const questionResults = useMemo(() => {
    return questions.map((q, index) => {
      const userAnswer = userAnswers[q.id];
      const storeResult = submissionResults[q.id];
      const hasAnswer = userAnswer !== undefined;
      
      let checkResult = null;
      if (storeResult) {
        checkResult = {
          isCorrect: storeResult.isCorrect,
          feedback: storeResult.feedback,
          score: storeResult.score,
          maxScore: storeResult.maxScore,
          matchedKeywords: storeResult.matchedKeywords,
          missingKeywords: storeResult.missingKeywords
        };
      } else if (hasAnswer) {
        const r = checkAnswer(q, userAnswer);
        checkResult = {
          isCorrect: r.isCorrect,
          feedback: r.feedback,
          score: r.score,
          maxScore: r.maxScore,
          matchedKeywords: r.matchedKeywords,
          missingKeywords: r.missingKeywords
        };
      }
      
      const knowledge = knowledgeList.find(k => k.id === q.knowledgeId);
      
      return {
        index,
        question: q,
        userAnswer,
        hasAnswer,
        isCorrect: checkResult ? !!checkResult.isCorrect : false,
        feedback: checkResult ? checkResult.feedback : '未作答',
        score: checkResult?.score ?? 0,
        maxScore: checkResult?.maxScore ?? 1,
        matchedKeywords: checkResult?.matchedKeywords,
        missingKeywords: checkResult?.missingKeywords,
        categoryName: knowledge?.categoryName || '其他',
        knowledgeId: knowledge?.id,
        knowledgeTitle: knowledge?.title || '未知知识点'
      };
    });
  }, [questions, userAnswers, submissionResults]);

  const correctCount = questionResults.filter(r => r.isCorrect).length;
  const wrongCount = questionResults.filter(r => !r.isCorrect && r.userAnswer !== undefined).length;
  const blankCount = questionResults.filter(r => r.userAnswer === undefined).length;
  const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const categoryGroups = useMemo(() => {
    if (questions.length === 0) return [];
    return groupQuestionsByCategory(questions, userAnswers);
  }, [questions, userAnswers]);

  const suggestions = useMemo(() => {
    return generateWeaknessSuggestions(categoryGroups);
  }, [categoryGroups]);

  const nextLevel = useMemo(() => {
    if (!level) return undefined;
    const nextId = level.id + 1;
    if (nextId > levelList.length) return undefined;
    return getLevelById(nextId);
  }, [level]);

  const handleCopyReport = () => {
    if (!level) return;
    
    const reportText = `
========================================
    政务服务实施清单编制培训考核报告
========================================

考生信息：${user.name}
考核等级：${level.name}
考核时间：${new Date(attemptDate).toLocaleString('zh-CN')}
考核用时：${formatTime(timeSpent)}

-------------- 成绩统计 --------------
综合得分：${score} 分（满分 100 分）
及格分数：${level.passScore} 分
考核结果：${isPassed ? '✅ 通过' : '❌ 未通过'}

判定正确：${correctCount} 题
判定错误：${wrongCount} 题
未作答：  ${blankCount} 题
正确率：  ${accuracy}%

------------ 各类别正确率 ------------
${categoryGroups.map(g => {
  const acc = g.totalCount > 0 ? Math.round((g.correctCount / g.totalCount) * 100) : 0;
  return `${g.categoryName.padEnd(8)}: ${g.correctCount}/${g.totalCount} (${acc}%)`;
}).join('\n')}

------------ 逐题判定明细 ------------
${questionResults.map(r => {
  const isMaterial = !!(r.matchedKeywords?.length || r.missingKeywords?.length);
  let verdict;
  if (!r.hasAnswer) {
    verdict = '⚪未作答';
  } else if (isMaterial) {
    verdict = r.isCorrect ? '✅通过' : '❌未通过';
  } else {
    verdict = r.isCorrect ? '✅正确' : '❌错误';
  }
  const coverage = isMaterial && r.hasAnswer && r.maxScore > 0 ? `(${Math.round((r.score / r.maxScore) * 100)}%)` : '';
  let line = `第${r.index + 1}题 [${r.question.typeName}] 判定:${verdict}${coverage} 得分:${r.score}/${r.maxScore}`;
  if (isMaterial) {
    const matched = r.matchedKeywords?.length ? r.matchedKeywords.join(',') : '无';
    const missing = r.missingKeywords?.length ? r.missingKeywords.join(',') : '无';
    line += `\n  命中: ${matched}  缺失: ${missing}`;
  } else {
    const userAns = Array.isArray(r.userAnswer) ? r.userAnswer.join('、') : (r.userAnswer || '未作答');
    const correctAns = Array.isArray(r.question.correctAnswer) ? r.question.correctAnswer.join('、') : r.question.correctAnswer;
    line += `\n  作答: ${userAns}  标准答案: ${correctAns}`;
  }
  return line;
}).join('\n')}

------------ 学习建议 ------------
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

========== 报告结束 ==========
    `;
    
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!level) {
    return (
      <PageLayout>
        <div className="p-6 lg:p-8">
          <EmptyState
            icon={Lock}
            title="考核报告不存在"
            description="该考核等级不存在，请重新选择考核关卡。"
            action={{
              label: "返回选关",
              onClick: () => navigate('/levels')
            }}
          />
        </div>
      </PageLayout>
    );
  }

  if (questions.length === 0 && score === 0) {
    return (
      <PageLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <EmptyState
            icon={FileCheck}
            title="暂无考核记录"
            description={
              currentProgress?.bestScore
                ? `你曾在「${level.name}」考核中取得 ${currentProgress.bestScore} 分的成绩，但暂无详细答题记录。重新参加考核可查看完整报告。`
                : '你还未参加本次考核，请完成答题后查看报告。'
            }
            action={{
              label: currentProgress?.bestScore ? "重新考核" : "去考核",
              onClick: () => navigate(`/levels/${level.id}`)
            }}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Report Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button 
            onClick={() => navigate('/levels')} 
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回选关
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-accent-500" />
              考核报告
            </h1>
          </div>
          <button
            onClick={handleCopyReport}
            className="btn-secondary flex items-center gap-2"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-success-500" />已复制</>
            ) : (
              <><Copy className="w-4 h-4" />复制成绩单</>
            )}
          </button>
        </div>

        {/* Pass / Fail Banner */}
        <div className={cn(
          'card overflow-hidden mb-6 animate-fade-in-up',
          isPassed ? 'border-success-200' : 'border-danger-200'
        )}>
          <div className={cn(
            'p-8 text-center relative overflow-hidden',
            isPassed 
              ? 'bg-gradient-to-br from-success-50 via-white to-success-50' 
              : 'bg-gradient-to-br from-danger-50 via-white to-danger-50'
          )}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30" 
                 style={{ color: isPassed ? '#16a34a' : '#dc2626' }} />
            
            <div className={cn(
              'w-28 h-28 mx-auto mb-5 flex items-center justify-center relative',
            )}>
              <div className={cn(
                'absolute inset-0 rounded-3xl rotate-6',
                isPassed ? 'bg-gradient-to-br from-success-400 to-success-600' : 'bg-gradient-to-br from-danger-400 to-danger-600'
              )} style={{ opacity: 0.15 }} />
              <div className={cn(
                'w-24 h-24 rounded-2xl flex items-center justify-center relative z-10 shadow-lg',
                isPassed 
                  ? 'bg-gradient-to-br from-success-500 to-success-700' 
                  : 'bg-gradient-to-br from-danger-500 to-danger-700'
              )}>
                {isPassed ? (
                  <Trophy className="w-12 h-12 text-white" />
                ) : (
                  <Target className="w-12 h-12 text-white" />
                )}
              </div>
            </div>

            <h2 className={cn(
              'text-3xl font-bold font-display mb-2',
              isPassed ? 'text-success-800' : 'text-danger-800'
            )}>
              {isPassed ? '🎉 考核通过！' : '考核未通过'}
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {isPassed 
                ? `恭喜你通过了「${level.name}」考核！继续挑战更高等级吧！`
                : `未达到及格线 ${level.passScore} 分，认真复习后再试一次！`
              }
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
              <div className="p-3 rounded-xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">综合得分</p>
                <p className={cn(
                  'text-2xl font-bold',
                  score >= (level.passScore || 0) ? 'text-success-600' : 'text-danger-600'
                )}>
                  {score}<span className="text-sm font-normal text-slate-400">/100</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">正确题数</p>
                <p className="text-2xl font-bold text-success-600">{correctCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">错误题数</p>
                <p className="text-2xl font-bold text-danger-600">{wrongCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">实际用时</p>
                <p className="text-2xl font-bold text-primary-600">{formatTime(timeSpent)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm md:col-span-1 col-span-2">
                <p className="text-xs text-slate-500 mb-1">答题正确率</p>
                <p className="text-2xl font-bold text-accent-600">{accuracy}%</p>
              </div>
            </div>

            {isPassed && nextLevel && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-100 border border-success-200 text-success-800 text-sm font-medium">
                <Unlock className="w-4 h-4" />
                已解锁「{nextLevel.name}」，快去挑战吧！
              </div>
            )}
          </div>
        </div>

        {/* Question Breakdown */}
        {questions.length > 0 && (
          <div className="card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-500" />
              答题情况详情
            </h3>
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
              {questionResults.map(r => (
                <button
                  key={r.question.id}
                  onClick={() => {
                    document.getElementById(`q-${r.index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={cn(
                    'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:scale-105',
                    r.hasAnswer && r.isCorrect && 'bg-success-100 text-success-700 hover:bg-success-200',
                    r.hasAnswer && !r.isCorrect && 'bg-danger-100 text-danger-700 hover:bg-danger-200',
                    !r.hasAnswer && 'bg-slate-100 text-slate-400'
                  )}
                  title={`${r.isCorrect ? '判定正确' : r.hasAnswer ? '判定错误' : '未作答'} - ${r.categoryName}`}
                >
                  {r.index + 1}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success-100" />判定正确</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger-100" />判定错误</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100" />未作答</span>
            </div>
          </div>
        )}

        {/* Category Mastery */}
        {categoryGroups.length > 0 && (
          <div className="card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-danger-500" />
              各类别掌握情况
            </h3>
            <div className="space-y-4">
              {categoryGroups.map((g) => {
                const accuracy = g.totalCount > 0 
                  ? Math.round((g.correctCount / g.totalCount) * 100) 
                  : 0;
                
                return (
                  <div key={g.category} className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="tag-primary">{g.categoryName}</span>
                          <span className="text-xs text-slate-500">
                            含 {g.knowledgeGroups.length} 个知识点
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          共 {g.totalCount} 题，答对 {g.correctCount} 题，错 {g.wrongQuestions.length} 题
                        </p>
                        {g.knowledgeGroups.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {g.knowledgeGroups.slice(0, 3).map(kg => (
                              <button
                                key={kg.knowledgeId}
                                onClick={() => navigate(`/rules/${kg.knowledgeId}`)}
                                className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                              >
                                📖 {kg.knowledgeTitle}
                              </button>
                            ))}
                            {g.knowledgeGroups.length > 3 && (
                              <span className="text-xs text-slate-400 px-2 py-0.5">
                                +{g.knowledgeGroups.length - 3} 个
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'text-2xl font-bold',
                          accuracy >= 80 && 'text-success-600',
                          accuracy >= 60 && accuracy < 80 && 'text-accent-600',
                          accuracy < 60 && 'text-danger-600'
                        )}>
                          {accuracy}%
                        </span>
                        {g.knowledgeGroups.length === 1 && (
                          <button
                            onClick={() => navigate(`/rules/${g.knowledgeGroups[0].knowledgeId}`)}
                            className="btn-secondary text-xs flex items-center gap-1 shrink-0"
                          >
                            <BookOpen className="w-3 h-3" />
                            复习
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          accuracy >= 80 && 'bg-gradient-to-r from-success-400 to-success-600',
                          accuracy >= 60 && accuracy < 80 && 'bg-gradient-to-r from-accent-400 to-accent-600',
                          accuracy < 60 && 'bg-gradient-to-r from-danger-400 to-danger-600'
                        )}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                    {g.wrongQuestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-600 mb-2">错题关联：</p>
                        <div className="flex flex-wrap gap-2">
                          {g.wrongQuestions.map((wq) => {
                            const qIdx = questionResults.findIndex(r => r.question.id === wq.id);
                            return (
                              <button
                                key={wq.id}
                                onClick={() => {
                                  document.getElementById(`q-${qIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                                className="text-xs px-2 py-1 rounded bg-danger-50 text-danger-700 border border-danger-200 hover:bg-danger-100 transition-colors"
                              >
                                第{qIdx + 1}题
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Question Results */}
        {questions.length > 0 && (
          <div className="card overflow-hidden mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary-500" />
                逐题判定记录
              </h3>
              <p className="text-xs text-slate-500 mt-1">点击可展开查看详细答题内容和判分依据</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {questionResults.map((r, idx) => {
                const expanded = expandedQuestions.has(idx);
                return (
                  <div 
                    key={r.question.id} 
                    id={`q-${r.index}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <div 
                      className="p-4 flex items-start gap-3 cursor-pointer"
                      onClick={() => toggleExpanded(idx)}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                        r.hasAnswer && r.isCorrect && 'bg-success-100',
                        r.hasAnswer && !r.isCorrect && 'bg-danger-100',
                        !r.hasAnswer && 'bg-slate-100'
                      )}>
                        {r.hasAnswer && r.isCorrect && <CheckCircle2 className="w-5 h-5 text-success-600" />}
                        {r.hasAnswer && !r.isCorrect && <XCircle className="w-5 h-5 text-danger-600" />}
                        {!r.hasAnswer && <span className="text-xs text-slate-400">空</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-bold text-slate-700">第 {r.index + 1} 题</span>
                          <span className="tag-accent text-xs">{r.question.typeName}</span>
                          <span className="tag text-xs bg-slate-100 text-slate-600">{r.question.itemTypeName}</span>
                          <span className="tag text-xs">{r.categoryName}</span>
                          {r.hasAnswer && r.maxScore > 1 && (
                            <span className={cn(
                              'tag text-xs',
                              (r.score / r.maxScore) >= 0.8 && 'tag-success',
                              (r.score / r.maxScore) >= 0.5 && (r.score / r.maxScore) < 0.8 && 'tag-accent',
                              (r.score / r.maxScore) < 0.5 && !r.isCorrect && 'tag-danger',
                            )}>
                              {r.score}/{r.maxScore}分
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">{r.question.content.replace(/\n/g, ' / ')}</p>
                      </div>
                      <ChevronRight className={cn(
                        'w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform',
                        expanded && 'rotate-90'
                      )} />
                    </div>
                    {expanded && (
                      <div className="px-4 pb-4 pl-16 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-danger-50 border border-danger-100">
                            <p className="text-xs font-medium text-danger-700 mb-1 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> 你的答案
                            </p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                              {Array.isArray(r.userAnswer) ? r.userAnswer.join('、') : (r.userAnswer || '（未作答）')}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-success-50 border border-success-100">
                            <p className="text-xs font-medium text-success-700 mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> 标准答案
                            </p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                              {Array.isArray(r.question.correctAnswer) 
                                ? r.question.correctAnswer.join('、') 
                                : r.question.correctAnswer}
                            </p>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-3">
                          <p className="text-xs font-medium text-slate-700 mb-1">判定依据</p>
                          <p className="text-sm text-slate-600">{r.question.ruleBasis}</p>
                        </div>
                        {r.feedback && (
                          <div className="p-3 rounded-lg bg-accent-50 border border-accent-100 mb-3">
                            <p className="text-xs font-medium text-accent-700 mb-1 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" /> 评卷反馈
                            </p>
                            <p className="text-sm text-slate-700">{r.feedback}</p>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rules/${r.knowledgeId}`);
                          }}
                          className="btn-primary text-xs flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          去学习「{r.knowledgeTitle}」
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weakness Suggestions */}
        {suggestions.length > 0 && (
          <div className="card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-accent-500" />
              薄弱点建议
            </h3>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li 
                  key={i} 
                  className={cn(
                    'p-4 rounded-xl border flex items-start gap-3',
                    i === 0 
                      ? 'bg-gradient-to-r from-danger-50 to-white border-danger-200' 
                      : i === 1
                        ? 'bg-gradient-to-r from-accent-50 to-white border-accent-200'
                        : 'bg-gradient-to-r from-primary-50 to-white border-primary-200'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold mt-0.5',
                    i === 0 && 'bg-danger-500 text-white',
                    i === 1 && 'bg-accent-500 text-white',
                    i >= 2 && 'bg-primary-500 text-white'
                  )}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{s}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="card p-6 flex flex-wrap gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          {wrongCount > 0 && (
            <button 
              onClick={() => navigate('/practice/result')} 
              className="btn-secondary flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              查看错因回顾
            </button>
          )}
          <button 
            onClick={() => navigate('/mistakes')} 
            className="btn-secondary flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            完整错题本
          </button>
          <button 
            onClick={() => {
              reset();
              navigate(`/levels/${level.id}`);
            }} 
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            再考一次
          </button>
          {isPassed && nextLevel && (
            <button 
              onClick={() => {
                reset();
                navigate(`/levels/${nextLevel.id}`);
              }} 
              className="btn-primary flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              挑战「{nextLevel.name}」
            </button>
          )}
          <button 
            onClick={() => navigate('/profile')} 
            className="btn-secondary flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            成绩面板
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    </PageLayout>
  );
};
