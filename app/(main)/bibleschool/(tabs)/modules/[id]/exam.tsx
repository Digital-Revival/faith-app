import { MainTopBar } from "@/app/(main)/_components/MainTopBar";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { routes } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useModule } from "@/hooks/useBibleschoolContent";
import { useLessonUnlocks } from "@/hooks/useLessonUnlocks";
import { useButtonShadow } from "@/hooks/useShadows";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { checkAndAwardBadges } from "@/services/api/badgeService";
import { moduleProgressService } from "@/services/api/moduleProgressService";
import { quizAttemptService } from "@/services/api/quizAttemptService";
import { queryKeys } from "@/services/queryKeys";
import { quizContentService } from "@/services/quizContentService";
import type { ModuleProgress, QuizAttempt } from "@/types/progress";
import type { QuizQuestion } from "@/types/quiz";
import { bzzt } from "@/utils/haptics";
import { recordStreakActivity } from "@/utils/streakActivity";
import { didPassExam, getMinCorrectRequired } from "@/utils/unlockLogic";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { runDeferredTask } from "@/utils/runDeferredTask";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EXAM_PROGRESS_KEY = (userId: string, moduleId: string) =>
  `@faith_app:exam_progress:${userId}:${moduleId}`;

function upsertQuizAttemptList(
  current: QuizAttempt[],
  nextAttempt: QuizAttempt,
): QuizAttempt[] {
  return [...current.filter((item) => item.id !== nextAttempt.id), nextAttempt].sort((a, b) => {
    if (a.module_id === b.module_id) {
      return b.attempt_number - a.attempt_number;
    }

    return a.module_id.localeCompare(b.module_id);
  });
}

function upsertModuleProgressList(
  current: ModuleProgress[],
  nextProgress: ModuleProgress,
): ModuleProgress[] {
  const existingIndex = current.findIndex((item) => item.module_id === nextProgress.module_id);

  if (existingIndex === -1) {
    return [...current, nextProgress];
  }

  return current.map((item, index) => (index === existingIndex ? nextProgress : item));
}

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: storyModule } = useModule(id, locale);
  const {
    isExamUnlocked,
    passedModuleIds,
    isLoading: unlocksLoading,
  } = useLessonUnlocks();
  const buttonShadow = useButtonShadow();

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["quizQuestions", id, locale],
    queryFn: () => quizContentService.getQuestionsForModule(id!, locale),
    enabled: !!id && !!storyModule,
  });

  const { data: attempts } = useQuery({
    queryKey: queryKeys.progress.allQuizAttempts(user?.id ?? ""),
    queryFn: () => quizAttemptService.listAllByUser(user!.id),
    enabled: !!user?.id && !!id,
    staleTime: 5 * 60 * 1000,
    select: (all) =>
      all
        .filter((a) => a.module_id === id)
        .sort((a, b) => b.attempt_number - a.attempt_number),
  });

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [passedResult, setPassedResult] = useState<{
    score: number;
    correct: number;
    total: number;
  } | null>(null);
  const [submitConfirmVisible, setSubmitConfirmVisible] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [alreadyPassedModalVisible, setAlreadyPassedModalVisible] =
    useState(false);
  const alreadyPassedHandledRef = useRef(false);
  const pendingLeaveActionRef = useRef<{
    type: string;
    payload?: object;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const introHeightRef = useRef(140);
  const cardTopsRef = useRef<number[]>([]);
  const [bottomBarHeight, setBottomBarHeight] = useState(120);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const SCROLL_THRESHOLD = 150;

  const completedAttemptCount = attempts?.length ?? 0;
  const attemptNumber = completedAttemptCount + 1;

  useEffect(() => {
    if (!user?.id || !id || !questions?.length || progressLoaded) return;
    const key = EXAM_PROGRESS_KEY(user.id, id);
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as
          | { answers: Record<string, string>; submitted?: boolean }
          | Record<string, string>;
        const answers =
          "answers" in parsed && typeof parsed.answers === "object"
            ? parsed.answers
            : (parsed as Record<string, string>);
        const valid: Record<string, string> = {};
        for (const q of questions) {
          const optionId = answers[q.id];
          if (optionId && q.options.some((o) => o.id === optionId)) {
            valid[q.id] = optionId;
          }
        }
        if (Object.keys(valid).length > 0) {
          setSelectedAnswers(valid);
          if (
            "submitted" in parsed &&
            parsed.submitted === true &&
            Object.keys(valid).length === questions.length
          ) {
            setSubmitted(true);
          } else {
            const firstUnansweredIndex = questions.findIndex(
              (q) => !valid[q.id],
            );
            if (firstUnansweredIndex >= 0) {
              runDeferredTask(() => {
                setTimeout(() => {
                  const top =
                    cardTopsRef.current[firstUnansweredIndex] ??
                    firstUnansweredIndex * 280;
                  const y = 24 + introHeightRef.current + top;
                  scrollRef.current?.scrollTo({
                    y: Math.max(0, y),
                    animated: true,
                  });
                }, 500);
              });
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setProgressLoaded(true));
  }, [user?.id, id, questions, progressLoaded]);

  useEffect(() => {
    if (!user?.id || !id || Object.keys(selectedAnswers).length === 0) return;
    const key = EXAM_PROGRESS_KEY(user.id, id);
    const payload = {
      answers: selectedAnswers,
      ...(submitted ? { submitted: true } : {}),
    };
    AsyncStorage.setItem(key, JSON.stringify(payload)).catch(() => {});
  }, [user?.id, id, selectedAnswers, submitted]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !id || !questions) return;
      const correct = questions.filter(
        (q) => selectedAnswers[q.id] === q.options.find((o) => o.correct)?.id,
      ).length;
      const score = Math.round((correct / questions.length) * 100);
      const passed = didPassExam(correct, questions.length);
      const attempt = await quizAttemptService.createAttempt(user.id, id, {
        attempt_number: attemptNumber,
        score_percentage: score,
        passed,
        answers: selectedAnswers,
        correct_count: correct,
        total_count: questions.length,
      });
      let moduleProgress: ModuleProgress | undefined;

      if (passed) {
        moduleProgress = await moduleProgressService.markCompleted(user.id, id);
      }

      return { attempt, moduleProgress, passed, score, correct, total: questions.length };
    },
    onSuccess: async (result) => {
      if (!result) return;
      if (user?.id) {
        const allAttemptsKey = queryKeys.progress.allQuizAttempts(user.id);
        const cachedAttempts = queryClient.getQueryData<QuizAttempt[] | undefined>(allAttemptsKey);

        if (Array.isArray(cachedAttempts)) {
          queryClient.setQueryData(allAttemptsKey, upsertQuizAttemptList(cachedAttempts, result.attempt));
        } else {
          queryClient.invalidateQueries({ queryKey: allAttemptsKey });
        }

        if (result.moduleProgress) {
          queryClient.setQueryData(
            queryKeys.progress.moduleProgress.byUserModule(user.id, id!),
            result.moduleProgress,
          );
          queryClient.setQueryData<ModuleProgress[] | undefined>(
            queryKeys.progress.moduleProgress.overview(user.id),
            (current) =>
              Array.isArray(current)
                ? upsertModuleProgressList(current, result.moduleProgress!)
                : current,
          );
        }

        await recordStreakActivity(user.id).catch(() => {});
        queryClient.invalidateQueries({
          queryKey: queryKeys.streak.display(user.id),
        });
        await checkAndAwardBadges(user.id).catch(() => []);
        queryClient.invalidateQueries({
          queryKey: queryKeys.badges.userBadges(user.id),
        });
      }
      if (result.passed) {
        if (user?.id && id) {
          await AsyncStorage.removeItem(EXAM_PROGRESS_KEY(user.id, id));
        }
        setPassedResult({
          score: result.score,
          correct: result.correct,
          total: result.total,
        });
        setShowSuccessScreen(true);
      } else {
        setSubmitted(true);
      }
    },
    onError: (error) => {
      if (__DEV__) {
        console.warn("[Exam] Submit failed:", error);
      }
      toast.error(t("quiz.submitError"));
    },
  });

  const scrollToQuestion = useCallback((idx: number) => {
    const top = cardTopsRef.current[idx] ?? idx * 280;
    const y = 24 + introHeightRef.current + top;
    scrollRef.current?.scrollTo({
      y: Math.max(0, y),
      animated: true,
    });
  }, []);

  const handleSelectAnswer = useCallback(
    (questionId: string, optionId: string, questionIndex: number) => {
      if (submitted) return;
      setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
      if (questions && questionIndex < questions.length - 1) {
        setTimeout(() => scrollToQuestion(questionIndex + 1), 300);
      }
    },
    [submitted, questions, scrollToQuestion],
  );

  const handleSubmit = useCallback(() => {
    if (!questions || questions.length === 0) return;
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      toast.error(t("quiz.answerAll"));
      return;
    }
    setSubmitConfirmVisible(true);
  }, [questions, selectedAnswers, t, toast]);

  const handleRetry = useCallback(() => {
    if (user?.id && id) {
      AsyncStorage.removeItem(EXAM_PROGRESS_KEY(user.id, id)).catch(() => {});
    }
    setSelectedAnswers({});
    setSubmitted(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [user, id]);

  useEffect(() => {
    if (unlocksLoading || !id || !storyModule || showSuccessScreen) return;
    if (!isExamUnlocked(id)) {
      toast.error(t("exam.unlockHint"));
      router.replace(routes.bibleschoolModule(id));
      return;
    }
    if (passedModuleIds.has(id) && !alreadyPassedHandledRef.current) {
      alreadyPassedHandledRef.current = true;
      setAlreadyPassedModalVisible(true);
    }
  }, [
    id,
    isExamUnlocked,
    passedModuleIds,
    unlocksLoading,
    storyModule,
    showSuccessScreen,
    toast,
    t,
  ]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (
        showSuccessScreen ||
        submitted ||
        Object.keys(selectedAnswers).length === 0 ||
        submitMutation.isPending
      ) {
        return;
      }
      e.preventDefault();
      pendingLeaveActionRef.current = e.data.action;
      setLeaveConfirmVisible(true);
    });
    return unsub;
  }, [
    navigation,
    selectedAnswers,
    submitted,
    showSuccessScreen,
    submitMutation.isPending,
    t,
  ]);

  if (!storyModule) return null;
  if (!unlocksLoading && !isExamUnlocked(id!)) return null;
  if (
    !unlocksLoading &&
    passedModuleIds.has(id!) &&
    !showSuccessScreen &&
    !alreadyPassedModalVisible
  )
    return null;

  const allAnswered =
    questions &&
    questions.length > 0 &&
    questions.every((q) => selectedAnswers[q.id]);

  const correctCount =
    questions?.filter(
      (q) => selectedAnswers[q.id] === q.options.find((o) => o.correct)?.id,
    ).length ?? 0;
  const scorePercentage =
    questions?.length && questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  return (
    <Box
      className="flex-1 px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t('quiz.examTopBarTitle')}
        currentSection="bibleschool"
        showBackButton
        onBack={() => navigation.goBack()}
      />

      <ConfirmModal
        visible={submitConfirmVisible}
        title={t("quiz.submitConfirmTitle")}
        message={t("quiz.submitConfirmMessage")}
        cancelLabel={t("quiz.cancel")}
        confirmLabel={t("quiz.submit")}
        onCancel={() => setSubmitConfirmVisible(false)}
        onConfirm={() => {
          setSubmitConfirmVisible(false);
          bzzt();
          submitMutation.mutate();
        }}
      />

      <ConfirmModal
        visible={leaveConfirmVisible}
        title={t("quiz.leaveConfirmTitle")}
        message={t("quiz.leaveConfirmMessage")}
        cancelLabel={t("quiz.cancel")}
        confirmLabel={t("quiz.backToModule")}
        variant="destructive"
        onCancel={() => {
          setLeaveConfirmVisible(false);
          pendingLeaveActionRef.current = null;
        }}
        onConfirm={() => {
          setLeaveConfirmVisible(false);
          const action = pendingLeaveActionRef.current;
          pendingLeaveActionRef.current = null;
          if (action) navigation.dispatch(action);
        }}
      />

      <ConfirmModal
        visible={alreadyPassedModalVisible}
        title={t("quiz.pass")}
        message={t("exam.alreadyPassed")}
        confirmLabel={t("quiz.backToModule")}
        showCancel={false}
        onCancel={() => {
          setAlreadyPassedModalVisible(false);
          router.replace(routes.bibleschoolModule(id!));
        }}
        onConfirm={() => {
          setAlreadyPassedModalVisible(false);
          router.replace(routes.bibleschoolModule(id!));
        }}
      />

      {questionsLoading ? (
        <LoadingScreen message={t("quiz.loading")} />
      ) : showSuccessScreen ? (
        <Box className="flex-1 items-center justify-center px-6">
          <Box
            className="rounded-full p-6 mb-6"
            style={{ backgroundColor: theme.badgeSuccess }}
          >
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={theme.quizCorrect}
            />
          </Box>
          <Text
            className="text-xl font-bold text-center mb-2"
            style={{ color: theme.textPrimary }}
          >
            {t("quiz.pass")}
          </Text>
          <Text
            className="text-base text-center mb-8"
            style={{ color: theme.textSecondary }}
          >
            {passedResult
              ? t("quiz.scoreSummary", {
                  score: passedResult.score,
                  correct: passedResult.correct,
                  total: passedResult.total,
                })
              : ""}
          </Text>
          <Button
            onPress={() => router.replace(routes.bibleschoolModule(id!))}
            action="primary"
            variant="solid"
            size="lg"
            className="h-14 cursor-pointer rounded-full min-w-[200]"
            style={{
              backgroundColor: theme.buttonPrimary,
              ...buttonShadow,
              shadowColor: theme.buttonPrimary,
            }}
          >
            <ButtonText
              className="text-base font-semibold"
              style={{ color: theme.buttonPrimaryContrast }}
            >
              {t("quiz.backToModule")}
            </ButtonText>
          </Button>
        </Box>
      ) : !questions || questions.length === 0 ? (
        <Box className="flex-1 items-center justify-center py-20">
          <Text style={{ color: theme.textSecondary }}>
            {t("lessonsPage.empty")}
          </Text>
        </Box>
      ) : (
        <Box className="flex-1">
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              setShowScrollToTop(y > SCROLL_THRESHOLD);
            }}
            scrollEventThrottle={100}
            contentContainerStyle={{
              paddingTop: 24,
              paddingBottom: 24,
            }}
          >
            <View
              onLayout={(e) => {
                introHeightRef.current = e.nativeEvent.layout.height;
              }}
            >
              {storyModule ? (
                <VStack className="mb-4 items-center px-2">
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider text-center mb-1.5"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('overview.moduleWithNumber', { number: storyModule.order })}
                  </Text>
                  <Text
                    className="text-lg font-semibold text-center"
                    style={{ color: theme.textPrimary }}
                  >
                    {storyModule.title}
                  </Text>
                </VStack>
              ) : null}
              <Text
                className="text-sm mb-4"
                style={{ color: theme.textSecondary }}
              >
                {t("quiz.intro", {
                  minCorrect: getMinCorrectRequired(questions.length),
                  total: questions.length,
                })}
              </Text>
            </View>
            <VStack className="gap-6">
              {questions.map((q, index) => (
                <View
                  key={q.id}
                  onLayout={(e) => {
                    cardTopsRef.current[index] = e.nativeEvent.layout.y;
                  }}
                >
                  <QuestionCard
                    question={q}
                    questionNumber={index + 1}
                    totalQuestions={questions.length}
                    selectedId={selectedAnswers[q.id]}
                    onSelect={(optionId) =>
                      handleSelectAnswer(q.id, optionId, index)
                    }
                    disabled={submitted}
                    showFeedback={submitted}
                    theme={theme}
                    t={t}
                  />
                </View>
              ))}
            </VStack>
          </ScrollView>
          <Box
            className="px-6 pt-4 pb-6"
            style={{
              paddingBottom: insets.bottom + 24,
              backgroundColor: theme.pageBg,
              borderTopWidth: 1,
              borderTopColor: theme.cardBorder,
            }}
            onLayout={(e) => {
              setBottomBarHeight(e.nativeEvent.layout.height);
            }}
          >
            {submitted ? (
              <VStack className="gap-3">
                {questions && questions.length > 0 && (
                  <Box
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <Box className="flex-row items-center justify-between mb-2">
                      <Text
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.textTertiary }}
                      >
                        {t("quiz.attemptNumber", { number: completedAttemptCount })}
                      </Text>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("quiz.scoreSummary", {
                          score: scorePercentage,
                          correct: correctCount,
                          total: questions.length,
                        })}
                      </Text>
                    </Box>
                    <Text
                      className="text-sm"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("quiz.fail", {
                        minCorrect: getMinCorrectRequired(questions.length),
                        total: questions.length,
                      })}
                    </Text>
                  </Box>
                )}
                <Button
                  onPress={handleRetry}
                  action="primary"
                  variant="solid"
                  size="lg"
                  className="h-14 cursor-pointer rounded-full"
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    ...buttonShadow,
                    shadowColor: theme.buttonPrimary,
                  }}
                >
                  <ButtonText
                    className="text-base font-semibold"
                    style={{ color: theme.buttonPrimaryContrast }}
                  >
                    {t("quiz.retry")}
                  </ButtonText>
                </Button>
              </VStack>
            ) : (
              <VStack className="gap-3">
                <Box>
                  <Text
                    className="text-sm font-medium mb-1.5"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("quiz.questionProgress", {
                      current: questions.filter((q) => selectedAnswers[q.id])
                        .length,
                      total: questions.length,
                    })}
                  </Text>
                  <View
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: theme.cardBorder }}
                  >
                    <View
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: theme.buttonPrimary,
                        width: `${(questions.filter((q) => selectedAnswers[q.id]).length / questions.length) * 100}%`,
                      }}
                    />
                  </View>
                </Box>
                <Button
                  onPress={handleSubmit}
                  action="primary"
                  variant="solid"
                  size="lg"
                  isDisabled={!allAnswered || submitMutation.isPending}
                  className="h-14 cursor-pointer rounded-full"
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    ...buttonShadow,
                    shadowColor: theme.buttonPrimary,
                  }}
                >
                  {submitMutation.isPending && (
                    <ButtonSpinner className="mr-2" />
                  )}
                  <ButtonText
                    className="text-base font-semibold"
                    style={{ color: theme.buttonPrimaryContrast }}
                  >
                    {t("quiz.submit")}
                  </ButtonText>
                </Button>
              </VStack>
            )}
          </Box>
          {showScrollToTop && (
            <View
              style={{
                position: "absolute",
                right: 12,
                bottom: insets.bottom + bottomBarHeight,
              }}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                onPress={() => {
                  bzzt();
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
                activeOpacity={0.7}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={28}
                  color={theme.textPrimary}
                />
              </TouchableOpacity>
            </View>
          )}
        </Box>
      )}
    </Box>
  );
}

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedId,
  onSelect,
  disabled,
  showFeedback,
  theme,
  t,
}: {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedId?: string;
  onSelect: (optionId: string) => void;
  disabled: boolean;
  showFeedback: boolean;
  theme: ReturnType<typeof useTheme>;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const correctOptionId = question.options.find((o) => o.correct)?.id;
  const isCorrect = selectedId === correctOptionId;

  return (
    <Box
      className="rounded-2xl p-4"
      style={{
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: showFeedback
          ? isCorrect
            ? theme.quizCorrect
            : theme.quizIncorrect
          : theme.cardBorder,
      }}
    >
      <Box className="mb-3">
        <Text
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: theme.textTertiary }}
        >
          {t("quiz.questionOf", {
            current: questionNumber,
            total: totalQuestions,
          })}
        </Text>
      </Box>
      {showFeedback && (
        <Box className="flex-row items-center gap-2 mb-3">
          <Ionicons
            name={isCorrect ? "checkmark-circle" : "close-circle"}
            size={28}
            color={isCorrect ? theme.quizCorrect : theme.quizIncorrect}
          />
          <Text
            className="text-base font-semibold"
            style={{
              color: isCorrect ? theme.quizCorrect : theme.quizIncorrect,
            }}
          >
            {isCorrect ? t("quiz.correct") : t("quiz.incorrect")}
          </Text>
        </Box>
      )}
      <Text
        className="text-base font-semibold mb-4"
        style={{ color: theme.textPrimary }}
      >
        {question.question ?? t(question.questionKey as never)}
      </Text>
      <VStack className="gap-2">
        {question.options.map((opt, optionIndex) => {
          const letterLabel = String.fromCharCode(65 + optionIndex);
          const isCorrectOption = opt.correct;
          const isUserSelection = selectedId === opt.id;
          const showAsCorrect = showFeedback && isCorrectOption;
          const showAsIncorrect =
            showFeedback && isUserSelection && !isCorrectOption;

          let optionBg = theme.pageBg;
          let optionBorder = theme.cardBorder;
          let optionTextColor = theme.textSecondary;
          if (showFeedback) {
            if (showAsCorrect) {
              optionBg = theme.quizCorrectBg;
              optionBorder = theme.quizCorrect;
              optionTextColor = theme.textPrimary;
            } else if (showAsIncorrect) {
              optionBg = theme.quizIncorrectBg;
              optionBorder = theme.quizIncorrect;
              optionTextColor = theme.textPrimary;
            } else if (isUserSelection) {
              optionBg = theme.pageBg;
              optionBorder = theme.cardBorder;
              optionTextColor = theme.textSecondary;
            }
          } else if (isUserSelection) {
            if (theme.isDark) {
              optionBg = "#FFFFFF";
              optionBorder = theme.cardBorder;
              optionTextColor = "#171717";
            } else {
              optionBg = "#171717";
              optionBorder = "#171717";
              optionTextColor = "#FFFFFF";
            }
          }

          const optionContent = (
            <Box
              className="rounded-xl p-3 flex-row items-center justify-between"
              style={{
                backgroundColor: optionBg,
                borderWidth: 1,
                borderColor: optionBorder,
              }}
            >
              <Box className="flex-1 flex-row items-start gap-2">
                <Text
                  className="text-sm font-bold"
                  style={{
                    color: optionTextColor,
                    minWidth: 22,
                    paddingTop: 1,
                  }}
                >
                  {letterLabel}.
                </Text>
                <Text
                  className="text-sm flex-1"
                  style={{ color: optionTextColor }}
                >
                  {opt.answer ?? t(opt.key as never)}
                </Text>
              </Box>
              {showFeedback && (
                <Ionicons
                  name={
                    showAsCorrect
                      ? "checkmark-circle"
                      : showAsIncorrect
                        ? "close-circle"
                        : "ellipse-outline"
                  }
                  size={26}
                  color={
                    showAsCorrect
                      ? theme.quizCorrect
                      : showAsIncorrect
                        ? theme.quizIncorrect
                        : theme.textTertiary
                  }
                />
              )}
            </Box>
          );

          return showFeedback ? (
            <Box key={opt.id}>{optionContent}</Box>
          ) : (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                bzzt();
                onSelect(opt.id);
              }}
              activeOpacity={0.7}
              className="cursor-pointer"
            >
              {optionContent}
            </TouchableOpacity>
          );
        })}
      </VStack>
    </Box>
  );
}
