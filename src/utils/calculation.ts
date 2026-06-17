import type { Question, UserAnswer, LearningStats, KnowledgeCategory, MistakeRecord } from '@/types';
import { KnowledgeCategoryNames } from '@/types';
import { knowledgeList } from '@/data/knowledge';

interface ExtendedCheckResult {
  isCorrect: boolean;
  correctAnswer: string | string[];
  score: number;
  maxScore: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  feedback?: string;
}

export const extractKeywords = (text: string): string[] => {
  const cleaned = text
    .replace(/[，。；：、！？（）【】《》""''\n\r]/g, ' ')
    .replace(/[,.!?()<>"']/g, ' ')
    .trim();
  
  const coreTerms = [
    '社保卡', '社会保障卡', '身份证', '身份证复印件', '居民身份证', '居民户口簿',
    '户口簿', '护照', '驾驶证', '行驶证', '营业执照', '统一社会信用代码',
    '共享核验', '数据共享', '共享核查', '联网核查', '电子证照', '证照共享',
    '告知承诺', '告知承诺书', '承诺制', '容缺受理', '容缺办理', '事后补交',
    '材料减免', '免提交', '无需提交', '不再提交', '免于提交',
    '申请表', '申请书', '委托书', '授权书', '承诺书', '协议书', '确认书',
    '原件', '复印件', '加盖公章', '原件核验', '纸质材料', '电子版',
    '本人办理', '委托办理', '代理人', '委托人', '经办人', '法定代表人',
    '工作证明', '收入证明', '居住证明', '社保证明', '纳税证明', '婚姻证明',
    '不动产权证', '房产证', '土地使用证', '建设工程规划许可证', '施工许可证',
    '受理条件', '申请材料', '法定依据', '承诺时限', '办理流程', '审查要点',
    '适用对象', '办理地点', '办理时间', '咨询电话', '监督电话',
    '行政许可', '行政给付', '行政确认', '行政奖励', '公共服务', '行政处罚',
    '即时办理', '当场办结', '网上办理', '最多跑一次', '零跑腿',
    '省级', '市级', '县级', '乡镇级', '街道级', '社区级',
    '自然人', '法人', '其他组织', '企业法人', '事业单位', '社会团体',
    '线上', '线下', '邮寄', '自取', '物流速递'
  ];
  
  const keywords: string[] = [];
  const added = new Set<string>();
  
  const addTerm = (term: string) => {
    if (term.length >= 2 && !added.has(term)) {
      added.add(term);
      keywords.push(term);
    }
  };
  
  coreTerms.forEach(term => {
    if (cleaned.toLowerCase().includes(term.toLowerCase())) {
      addTerm(term);
    }
  });
  
  const phrases = cleaned.split(/\s+/).filter(s => s.length >= 2);
  
  const stopWords = new Set([
    '的', '了', '和', '与', '及', '或', '在', '对', '向', '为', '以', '于', '上', '下',
    '中', '内', '外', '前', '后', '等', '应', '当', '需', '要', '可', '以', '将', '把',
    '被', '由', '所', '之', '其', '该', '此', '各', '每', '一', '二', '三', '四', '五',
    '是', '有', '无', '不', '也', '都', '就', '并', '而', '且', '若', '如', '因', '则',
    '需提交', '应当', '必须', '可以', '相关', '对应', '材料', '内容', '条件', '依据',
    '要求', '规定', '情况', '方式', '申请', '受理', '承诺', '提交', '提供', '办理',
    '需要', '按照', '根据', '参照', '执行', '符合', '满足', '审核', '审批', '核实',
    '核验', '核查', '核对', '查验', '检查', '审查', '核实', '确认', '决定',
    '进行', '通过', '采用', '实施', '开展', '做好', '完成', '实现', '达到',
    '及时', '按时', '有效', '齐全', '完整', '真实', '准确', '规范', '标准',
    '相应', '有关', '相关', '各类', '各项', '各种', '若干', '以下', '以上',
    '包括', '包含', '以及', '或者', '还是', '要么', '不是', '没有',
    '一个', '一种', '一项', '一份', '一套', '一批', '一起', '一同',
    '申请人', '申请方', '当事人', '相关人', '有关单位', '涉及'
  ]);
  
  phrases.forEach(phrase => {
    if (!stopWords.has(phrase) && phrase.length >= 2 && !added.has(phrase)) {
      const alreadyCovered = coreTerms.some(ct => 
        ct.includes(phrase) || phrase.includes(ct)
      );
      if (!alreadyCovered) {
        addTerm(phrase);
      }
    }
  });
  
  if (keywords.length === 0) {
    phrases.filter(p => p.length >= 2).forEach(p => addTerm(p));
  }
  
  return [...keywords];
};

export const calculateKeywordMatch = (
  userText: string,
  correctText: string | string[]
): {
  matchedKeywords: string[];
  missingKeywords: string[];
  score: number;
  maxScore: number;
} => {
  const correctStr = Array.isArray(correctText) ? correctText.join(' ') : correctText;
  const keywords = extractKeywords(correctStr);
  
  if (keywords.length === 0) {
    const isExact = userText.trim().toLowerCase() === correctStr.trim().toLowerCase();
    return {
      matchedKeywords: isExact ? ['完全匹配'] : [],
      missingKeywords: isExact ? [] : ['内容不符'],
      score: isExact ? 1 : 0,
      maxScore: 1
    };
  }
  
  const userLower = userText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  
  keywords.forEach(kw => {
    if (userLower.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });
  
  const ratio = keywords.length > 0 ? matched.length / keywords.length : 0;
  
  return {
    matchedKeywords: matched,
    missingKeywords: missing,
    score: matched.length,
    maxScore: keywords.length
  };
};

const isMaterialWriteType = (question: Question): boolean => {
  return question.type === 'materialWrite' || 
         question.subType === 'materialReduction' ||
         question.subType === 'materialList' ||
         question.subType === 'informCommitment' ||
         question.typeName?.includes('编写') === true;
};

export const checkAnswer = (
  question: Question,
  userAnswer: string | string[]
): ExtendedCheckResult => {
  const correctAnswer = question.correctAnswer;
  
  if (isMaterialWriteType(question)) {
    const userStr = Array.isArray(userAnswer) ? userAnswer.join(' ') : (userAnswer || '');
    const correctStr = Array.isArray(correctAnswer) ? correctAnswer.join(' ') : correctAnswer;
    
    const keywordResult = calculateKeywordMatch(userStr, correctStr);
    const ratio = keywordResult.maxScore > 0 
      ? keywordResult.score / keywordResult.maxScore 
      : 0;
    const isCorrect = ratio >= 0.6;
    
    let feedback = '';
    if (ratio >= 0.9) {
      feedback = '优秀！关键要素基本齐全，表述完整规范。';
    } else if (ratio >= 0.6) {
      feedback = `良好！已命中主要要素。建议补充：${keywordResult.missingKeywords.slice(0, 3).join('、')}。`;
    } else if (ratio >= 0.3) {
      feedback = `部分正确。已覆盖：${keywordResult.matchedKeywords.slice(0, 3).join('、')}。还需补充更多关键内容。`;
    } else {
      feedback = '要素不足。请仔细审题，确保涵盖适用对象、减免材料、核验方式等核心要素。';
    }
    
    return {
      isCorrect,
      correctAnswer,
      score: keywordResult.score,
      maxScore: keywordResult.maxScore,
      matchedKeywords: keywordResult.matchedKeywords,
      missingKeywords: keywordResult.missingKeywords,
      feedback
    };
  }
  
  if (question.type === 'fillBlank') {
    if (Array.isArray(correctAnswer)) {
      const userArr = Array.isArray(userAnswer) ? userAnswer : [];
      let blankCorrect = 0;
      const total = correctAnswer.length;
      
      correctAnswer.forEach((expected, idx) => {
        const actual = (userArr[idx] || '').trim().toLowerCase();
        if (actual === expected.trim().toLowerCase() || 
            (expected.trim().toLowerCase().length >= 3 && 
             actual.includes(expected.trim().toLowerCase())) ||
            (expected.trim().toLowerCase().length >= 3 && 
             expected.trim().toLowerCase().includes(actual))) {
          blankCorrect++;
        }
      });
      
      const isCorrect = blankCorrect === total;
      const ratio = total > 0 ? blankCorrect / total : 0;
      
      return {
        isCorrect,
        correctAnswer,
        score: blankCorrect,
        maxScore: total,
        feedback: isCorrect 
          ? '全部正确！' 
          : `已填对 ${blankCorrect}/${total} 个空，请对照参考答案检查。`
      };
    }
  }
  
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(userAnswer)) {
      return { 
        isCorrect: false, 
        correctAnswer,
        score: 0,
        maxScore: correctAnswer.length,
        feedback: '请选择所有正确选项。'
      };
    }
    const sortedCorrect = [...correctAnswer].sort();
    const sortedUser = [...userAnswer].sort();
    
    let selectedCorrect = 0;
    sortedUser.forEach(val => {
      if (sortedCorrect.includes(val)) selectedCorrect++;
    });
    
    const allSelected = sortedCorrect.every(val => sortedUser.includes(val));
    const noWrong = selectedCorrect === sortedUser.length;
    const isCorrect = allSelected && noWrong && sortedCorrect.length === sortedUser.length;
    
    return { 
      isCorrect, 
      correctAnswer,
      score: isCorrect ? sortedCorrect.length : selectedCorrect - (sortedUser.length - selectedCorrect),
      maxScore: sortedCorrect.length,
      feedback: isCorrect 
        ? '全部正确！' 
        : `已选对 ${selectedCorrect}/${sortedCorrect.length} 项${sortedUser.length > selectedCorrect ? `，误选 ${sortedUser.length - selectedCorrect} 项` : ''}。`
    };
  }
  
  if (Array.isArray(userAnswer)) {
    return { 
      isCorrect: false, 
      correctAnswer,
      score: 0,
      maxScore: 1,
      feedback: '请选择一个正确答案。'
    };
  }
  
  const userTrim = userAnswer.trim().toLowerCase();
  const correctTrim = correctAnswer.trim().toLowerCase();
  const isExact = userTrim === correctTrim;
  const isPartial = correctTrim.length >= 4 && 
                    (userTrim.includes(correctTrim) || correctTrim.includes(userTrim)) &&
                    Math.abs(userTrim.length - correctTrim.length) / correctTrim.length < 0.3;
  
  return { 
    isCorrect: isExact || isPartial, 
    correctAnswer,
    score: isExact ? 1 : (isPartial ? 0.5 : 0),
    maxScore: 1,
    feedback: isExact ? '回答正确！' : (isPartial ? '接近正确答案，请核对标准表述。' : '回答有误，请对照参考答案学习。')
  };
};

export const calculateScore = (
  questions: Question[],
  userAnswers: Record<string, string | string[]>
): { correct: number; total: number; score: number; detailResults: Array<{ questionId: string; isCorrect: boolean; score: number; maxScore: number }> } => {
  let correct = 0;
  let totalScore = 0;
  let totalMaxScore = 0;
  const detailResults: Array<{ questionId: string; isCorrect: boolean; score: number; maxScore: number }> = [];
  
  questions.forEach(q => {
    const userAnswer = userAnswers[q.id];
    if (userAnswer !== undefined) {
      const result = checkAnswer(q, userAnswer);
      if (result.isCorrect) correct++;
      totalScore += result.score;
      totalMaxScore += result.maxScore;
      detailResults.push({
        questionId: q.id,
        isCorrect: result.isCorrect,
        score: result.score,
        maxScore: result.maxScore
      });
    } else {
      detailResults.push({
        questionId: q.id,
        isCorrect: false,
        score: 0,
        maxScore: 0
      });
    }
  });
  
  const total = questions.length;
  const score = totalMaxScore > 0 
    ? Math.round((totalScore / totalMaxScore) * 100) 
    : (total > 0 ? Math.round((correct / total) * 100) : 0);
  return { correct, total, score, detailResults };
};

export interface CategoryKnowledgeSubGroup {
  knowledgeId: string;
  knowledgeTitle: string;
  questions: Question[];
  wrongQuestions: Question[];
  correctCount: number;
  totalCount: number;
}

export interface CategoryQuestionGroup {
  category: KnowledgeCategory;
  categoryName: string;
  questions: Question[];
  wrongQuestions: Question[];
  correctCount: number;
  totalCount: number;
  knowledgeGroups: CategoryKnowledgeSubGroup[];
}

export const groupQuestionsByCategory = (
  questions: Question[],
  userAnswers: Record<string, string | string[]>
): CategoryQuestionGroup[] => {
  const categoryMap = new Map<KnowledgeCategory, CategoryQuestionGroup>();
  const categoryKnowledgeMap = new Map<KnowledgeCategory, Map<string, CategoryKnowledgeSubGroup>>();
  
  questions.forEach(q => {
    const knowledge = knowledgeList.find(k => k.id === q.knowledgeId);
    if (!knowledge) return;
    
    const category = knowledge.category;
    const userAnswer = userAnswers[q.id];
    const isCorrect = userAnswer !== undefined && checkAnswer(q, userAnswer).isCorrect;
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        categoryName: knowledge.categoryName,
        questions: [],
        wrongQuestions: [],
        correctCount: 0,
        totalCount: 0,
        knowledgeGroups: []
      });
      categoryKnowledgeMap.set(category, new Map());
    }
    
    const categoryGroup = categoryMap.get(category)!;
    const knowledgeSubMap = categoryKnowledgeMap.get(category)!;
    
    if (!knowledgeSubMap.has(knowledge.id)) {
      knowledgeSubMap.set(knowledge.id, {
        knowledgeId: knowledge.id,
        knowledgeTitle: knowledge.title,
        questions: [],
        wrongQuestions: [],
        correctCount: 0,
        totalCount: 0
      });
    }
    
    const knowledgeGroup = knowledgeSubMap.get(knowledge.id)!;
    
    categoryGroup.questions.push(q);
    categoryGroup.totalCount++;
    knowledgeGroup.questions.push(q);
    knowledgeGroup.totalCount++;
    
    if (isCorrect) {
      categoryGroup.correctCount++;
      knowledgeGroup.correctCount++;
    } else {
      categoryGroup.wrongQuestions.push(q);
      knowledgeGroup.wrongQuestions.push(q);
    }
  });
  
  categoryMap.forEach((group, category) => {
    const subMap = categoryKnowledgeMap.get(category);
    if (subMap) {
      group.knowledgeGroups = Array.from(subMap.values()).sort((a, b) => 
        (a.correctCount / Math.max(1, a.totalCount)) - (b.correctCount / Math.max(1, b.totalCount))
      );
    }
  });
  
  return Array.from(categoryMap.values()).sort((a, b) => 
    (a.correctCount / Math.max(1, a.totalCount)) - (b.correctCount / Math.max(1, b.totalCount))
  );
};

export const generateWeaknessSuggestions = (
  categoryGroups: CategoryQuestionGroup[]
): string[] => {
  const suggestions: string[] = [];
  const weakGroups = categoryGroups.filter(g => 
    g.totalCount > 0 && (g.correctCount / g.totalCount) < 0.7
  ).sort((a, b) => 
    (a.correctCount / Math.max(1, a.totalCount)) - (b.correctCount / Math.max(1, b.totalCount))
  );
  
  weakGroups.slice(0, 3).forEach((g, idx) => {
    const accuracy = Math.round((g.correctCount / g.totalCount) * 100);
    const weakestKnowledge = g.knowledgeGroups[0];
    const knowledgeText = weakestKnowledge
      ? `重点复习「${weakestKnowledge.knowledgeTitle}」（正确率 ${Math.round((weakestKnowledge.correctCount / Math.max(1, weakestKnowledge.totalCount)) * 100)}%）`
      : '结合错题解析强化记忆';
    
    suggestions.push(
      `${idx + 1}. 「${g.categoryName}」模块正确率仅${accuracy}%，${knowledgeText}，仔细核对错题涉及的判定要素。`
    );
  });
  
  if (suggestions.length === 0) {
    suggestions.push('本次练习表现良好，建议继续保持，尝试挑战更高难度的题目以巩固能力。');
  }
  
  return suggestions;
};

export const determineMistakeType = (question: Question): string => {
  const knowledge = knowledgeList.find(k => k.id === question.knowledgeId);
  if (!knowledge) return 'other';
  
  const typeMap: Record<KnowledgeCategory, string> = {
    acceptCondition: 'incompleteCondition',
    applicationMaterial: 'nonStandardMaterial',
    legalBasis: 'incorrectBasis',
    promiseTime: 'unreasonableTime',
    materialReduction: 'nonStandardMaterial',
    commonMistakes: 'other',
  };
  
  return typeMap[knowledge.category] || 'other';
};

export const getMistakeType = (question: Question): string => {
  return determineMistakeType(question);
};

export const calculateLearningStats = (
  answerRecords: UserAnswer[],
  questionList: Question[],
  levelProgress: { levelId: number; isPassed: boolean }[],
  mistakeRecords: MistakeRecord[]
): LearningStats => {
  const totalQuestions = answerRecords.length;
  const correctCount = answerRecords.filter(r => r.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const totalTime = answerRecords.reduce((sum, r) => sum + r.timeSpent, 0);
  
  const answerDates = new Set(answerRecords.map(r => new Date(r.answerTime).toDateString()));
  const studyDays = answerDates.size;
  
  const categoryStats: Record<string, { correct: number; total: number }> = {};
  answerRecords.forEach(record => {
    const question = questionList.find(q => q.id === record.questionId);
    if (!question) return;
    
    const knowledge = knowledgeList.find(k => k.id === question.knowledgeId);
    if (!knowledge) return;
    
    const category = knowledge.category;
    if (!categoryStats[category]) {
      categoryStats[category] = { correct: 0, total: 0 };
    }
    categoryStats[category].total++;
    if (record.isCorrect) {
      categoryStats[category].correct++;
    }
  });
  
  const categoryAccuracy = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    categoryName: KnowledgeCategoryNames[category as KnowledgeCategory] || category,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    total: stats.total,
    correct: stats.correct,
  }));
  
  const recentTrend: { date: string; accuracy: number; count: number }[] = [];
  const last7Days = new Array(7).fill(0).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
  
  last7Days.forEach(dateStr => {
    const dayRecords = answerRecords.filter(r => new Date(r.answerTime).toDateString() === dateStr);
    if (dayRecords.length > 0) {
      const dayCorrect = dayRecords.filter(r => r.isCorrect).length;
      const dayAccuracy = Math.round((dayCorrect / dayRecords.length) * 100);
      recentTrend.push({
        date: new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        accuracy: dayAccuracy,
        count: dayRecords.length,
      });
    } else {
      recentTrend.push({
        date: new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        accuracy: 0,
        count: 0,
      });
    }
  });
  
  return {
    totalQuestions,
    correctCount,
    accuracy,
    totalTime,
    studyDays,
    levelProgress,
    categoryAccuracy,
    recentTrend,
  };
};

export const getWeakCategories = (
  categoryAccuracy: LearningStats['categoryAccuracy'],
  threshold: number = 70
): string[] => {
  return categoryAccuracy
    .filter(c => c.accuracy < threshold && c.total >= 3)
    .map(c => c.category);
};
