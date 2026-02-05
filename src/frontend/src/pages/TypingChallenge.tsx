import { useState, useEffect, useRef } from 'react';
import { useSaveChallengeSession } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Clock, Zap, Target, Home, Trophy, SkipForward, CheckCircle, AlertTriangle } from 'lucide-react';

interface TypingChallengeProps {
  onReturn: () => void;
}

// Local type for frontend calculations (using number instead of bigint)
interface LocalChallengeMetrics {
  xpEarned: number;
  accuracyPercent: number;
  wpm: number;
  correctWords: number;
  mistypedWords: number;
  untypedWords: number;
}

const LEVELS = [
  {
    level: 1,
    wordCount: 20,
    text: 'The quick brown fox jumps over the lazy dog while children play with colorful kites on sunny afternoons near the peaceful riverbank.',
  },
  {
    level: 2,
    wordCount: 50,
    text: 'Technology has revolutionized the way we communicate and interact with each other in modern society today. From smartphones to social media platforms digital innovation continues to shape our daily lives in unprecedented ways around the world. The internet connects billions of people across the globe enabling instant communication and access to vast amounts of information.',
  },
  {
    level: 3,
    wordCount: 100,
    text: 'Artificial intelligence and machine learning are transforming industries worldwide from healthcare to finance transportation to entertainment and beyond. These technologies enable computers to learn from data recognize patterns and make decisions with minimal human intervention required. As AI systems become more sophisticated they are being integrated into everyday applications helping us solve complex problems and automate routine tasks efficiently. The potential benefits are enormous but so are the ethical considerations and challenges we must address carefully. Privacy concerns algorithmic bias and the impact on employment are just a few of the critical issues that society must navigate as we embrace this technological revolution together.',
  },
  {
    level: 4,
    wordCount: 200,
    text: 'Climate change represents one of the most pressing challenges facing humanity in the twenty first century today. Rising global temperatures melting ice caps and increasingly severe weather events are clear indicators that our planet is undergoing significant environmental transformation right now. Scientists worldwide have reached a consensus that human activities particularly the burning of fossil fuels and deforestation are the primary drivers of these changes we observe. The consequences are far reaching affecting ecosystems agriculture water resources and human health across all continents. Coastal communities face the threat of rising sea levels while inland regions experience more frequent droughts and wildfires annually. To address this crisis governments businesses and individuals must work together to reduce greenhouse gas emissions transition to renewable energy sources and implement sustainable practices everywhere. Innovation in clean technology changes in consumer behavior and international cooperation are all essential components of the solution we need. The decisions we make today will determine the quality of life for future generations and the health of our planet for centuries to come ahead.',
  },
  {
    level: 5,
    wordCount: 500,
    text: 'The history of human civilization is a testament to our species remarkable ability to adapt innovate and overcome challenges throughout time. From the earliest hunter gatherer societies to the complex urban centers of today humans have continuously evolved their social structures technologies and cultural practices over millennia. The agricultural revolution which began approximately ten thousand years ago marked a pivotal turning point in human history forever. By domesticating plants and animals our ancestors were able to establish permanent settlements leading to the development of cities writing systems and organized governments across regions. This transformation laid the foundation for all subsequent human achievements we celebrate today. The industrial revolution of the eighteenth and nineteenth centuries brought about another dramatic shift as mechanization and mass production fundamentally altered the way people lived and worked everywhere. Factories replaced farms as the primary source of employment and urbanization accelerated at an unprecedented pace worldwide. The twentieth century witnessed even more rapid change with advances in medicine transportation and communication reshaping society in profound ways never seen before. The invention of the automobile airplane telephone and television connected people across vast distances and transformed daily life completely. The digital revolution of the late twentieth and early twenty first centuries has ushered in the information age where knowledge and data have become the most valuable commodities available. The internet personal computers and mobile devices have created a globally interconnected world where information flows freely and instantaneously everywhere. Social media platforms have changed how we communicate share ideas and form communities online. E commerce has revolutionized retail while streaming services have transformed entertainment consumption patterns. Looking ahead emerging technologies such as artificial intelligence quantum computing biotechnology and renewable energy promise to bring about even more dramatic changes soon. These innovations have the potential to solve some of humanitys greatest challenges from disease and poverty to climate change and resource scarcity worldwide. However they also raise important ethical questions and potential risks that society must carefully consider together. As we stand on the threshold of this new era it is crucial that we approach these developments with wisdom foresight and a commitment to ensuring that technological progress benefits all of humanity equally.',
  },
];

const TOTAL_TIME_LIMIT = 600; // 10 minutes in seconds

export default function TypingChallenge({ onReturn }: TypingChallengeProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_LIMIT);
  const [xp, setXp] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [completionReason, setCompletionReason] = useState<'manual' | 'timeout' | 'finished'>('finished');
  const [showExceededTooltip, setShowExceededTooltip] = useState(false);
  
  // Track time bonus eligibility
  const [hasMistype, setHasMistype] = useState(false);
  const [hasSkippedLevel, setHasSkippedLevel] = useState(false);
  const [hasSkippedWord, setHasSkippedWord] = useState(false);
  
  // Track completion metrics (using local type with number)
  const [completionMetrics, setCompletionMetrics] = useState<LocalChallengeMetrics | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const saveChallengeSession = useSaveChallengeSession();

  const currentLevelData = LEVELS[currentLevel];
  const words = currentLevelData.text.split(' ');
  const typedWords = userInput.trim().split(' ');
  const progress = (typedWords.length / words.length) * 100;
  const requiredWords = currentLevelData.wordCount;

  // Check if user exceeded required words
  const hasExceededWords = typedWords.length > requiredWords;

  useEffect(() => {
    if (!isStarted || isComplete) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isComplete]);

  // Show exceeded tooltip when user types beyond required words
  useEffect(() => {
    if (hasExceededWords) {
      setShowExceededTooltip(true);
    } else {
      setShowExceededTooltip(false);
    }
  }, [hasExceededWords]);

  const calculateMetrics = (): LocalChallengeMetrics => {
    let correctWords = 0;
    let mistypedWords = 0;
    let untypedWords = 0;
    let totalXP = 0;
    
    const typedWordsArray = userInput.trim().split(' ');

    typedWordsArray.forEach((typedWord, index) => {
      if (index < words.length) {
        if (typedWord === words[index]) {
          correctWords++;
          totalXP += 5;
        } else if (typedWord !== '') {
          mistypedWords++;
          totalXP -= 10;
          if (!hasMistype) {
            setHasMistype(true);
          }
        }
      }
    });

    // Count untyped words
    untypedWords = Math.max(0, words.length - typedWordsArray.length);

    // Calculate accuracy
    const totalWordsAttempted = correctWords + mistypedWords;
    const accuracyPercent = totalWordsAttempted > 0 ? (correctWords / totalWordsAttempted) * 100 : 0;

    // Calculate WPM
    const elapsedSeconds = TOTAL_TIME_LIMIT - timeRemaining;
    const elapsedMinutes = elapsedSeconds / 60;
    const wpm = elapsedMinutes > 0 ? Math.round(correctWords / elapsedMinutes) : 0;

    return {
      xpEarned: totalXP,
      accuracyPercent,
      wpm,
      correctWords,
      mistypedWords,
      untypedWords,
    };
  };

  const handleTimeUp = async () => {
    const metrics = calculateMetrics();
    const levelXP = metrics.xpEarned;
    const finalXP = xp + levelXP;
    
    // Timeout means incomplete, so no time bonus
    setHasSkippedWord(true);
    
    setXp(finalXP);
    setCompletionReason('timeout');
    
    // Calculate final metrics with updated XP
    const finalMetrics: LocalChallengeMetrics = {
      ...metrics,
      xpEarned: finalXP,
    };
    setCompletionMetrics(finalMetrics);
    setIsComplete(true);
    toast.error('Time is up! Challenge ended.');
    await handleChallengeComplete(finalMetrics);
  };

  const handleStart = () => {
    setIsStarted(true);
    setXp(0);
    setHasMistype(false);
    setHasSkippedLevel(false);
    setHasSkippedWord(false);
    setCompletionMetrics(null);
    inputRef.current?.focus();
  };

  const calculateXP = () => {
    let totalXP = 0;
    const typedWordsArray = userInput.trim().split(' ');

    typedWordsArray.forEach((typedWord, index) => {
      if (index < words.length) {
        if (typedWord === words[index]) {
          totalXP += 5;
        } else if (typedWord !== '') {
          totalXP -= 10;
          if (!hasMistype) {
            setHasMistype(true);
          }
        }
      }
    });

    return totalXP;
  };

  const handleLevelComplete = () => {
    const levelXP = calculateXP();
    const newTotalXP = xp + levelXP;
    setXp(newTotalXP);

    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setUserInput('');
      toast.success(`Level ${currentLevel + 1} complete! +${levelXP} XP`);
    } else {
      // Completed all 5 levels naturally
      setCompletionReason('finished');
      const metrics = calculateMetrics();
      
      // Calculate time bonus
      let timeBonus = 0;
      const eligibleForBonus = !hasMistype && !hasSkippedLevel && !hasSkippedWord;
      
      if (eligibleForBonus && timeRemaining > 0) {
        timeBonus = timeRemaining * 5;
        toast.success(`Perfect run! Time bonus: +${timeBonus} XP (${timeRemaining}s remaining)`);
      }
      
      const finalXP = newTotalXP + timeBonus;
      setXp(finalXP);
      
      const finalMetrics: LocalChallengeMetrics = {
        ...metrics,
        xpEarned: finalXP,
      };
      setCompletionMetrics(finalMetrics);
      setIsComplete(true);
      handleChallengeComplete(finalMetrics);
    }
  };

  const handleNextLevel = () => {
    const typedWordsCount = typedWords.length;
    
    // If exceeded required words, show tooltip and don't advance
    if (typedWordsCount > requiredWords) {
      setShowExceededTooltip(true);
      toast.warning(`You've exceeded the required ${requiredWords} words. Please complete the level with exactly ${requiredWords} words.`);
      return;
    }
    
    // If exactly at required words, advance immediately
    if (typedWordsCount === requiredWords) {
      handleLevelComplete();
      return;
    }
    
    // If less than required words, show skip confirmation
    setShowSkipDialog(true);
  };

  const handleFinish = async () => {
    const metrics = calculateMetrics();
    const levelXP = metrics.xpEarned;
    const finalXP = xp + levelXP;
    
    // Check if we completed all words in the current level
    const typedWordsArray = userInput.trim().split(' ');
    const allWordsTyped = typedWordsArray.length >= words.length;
    
    // If not all words typed or not on last level, mark as skipped
    if (!allWordsTyped || currentLevel < LEVELS.length - 1) {
      setHasSkippedWord(true);
    }
    
    setXp(finalXP);
    setCompletionReason('manual');
    
    const finalMetrics: LocalChallengeMetrics = {
      ...metrics,
      xpEarned: finalXP,
    };
    setCompletionMetrics(finalMetrics);
    setIsComplete(true);
    toast.success('Challenge finished!');
    await handleChallengeComplete(finalMetrics);
  };

  const confirmSkipLevel = () => {
    const levelXP = calculateXP();
    const newTotalXP = xp + levelXP;
    setXp(newTotalXP);
    
    // Mark that we skipped a level
    setHasSkippedLevel(true);

    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setUserInput('');
      setShowSkipDialog(false);
      toast.info(`Skipped to Level ${currentLevel + 2}. XP: ${newTotalXP}`);
      inputRef.current?.focus();
    }
  };

  const handleChallengeComplete = async (metrics: LocalChallengeMetrics) => {
    try {
      await saveChallengeSession.mutateAsync(metrics);
      toast.success('Session saved successfully!');
    } catch (error: any) {
      console.error('Failed to save session:', error);
      toast.error('Failed to save session: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    const currentTypedWords = value.trim().split(' ');
    if (currentTypedWords.length >= words.length && value.endsWith(' ')) {
      handleLevelComplete();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Pasting is not allowed!');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    toast.error('Drag and drop is not allowed!');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletionMessage = () => {
    switch (completionReason) {
      case 'timeout':
        return 'Time ran out! Your progress has been saved.';
      case 'manual':
        return 'You finished the challenge early!';
      case 'finished':
        return 'Great job on completing the typing challenge';
      default:
        return 'Challenge complete!';
    }
  };

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Typing Challenge</h2>
          <p className="text-muted-foreground">5 levels, 10 minutes, earn XP for accuracy</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Challenge Rules</CardTitle>
            <CardDescription>Read carefully before starting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Scoring:</strong> +5 XP per correct word, -10 XP per incorrect word. Untyped words = 0 XP.
              </AlertDescription>
            </Alert>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Time Limit:</strong> 10 minutes total for all 5 levels. Challenge ends automatically when time runs out.
              </AlertDescription>
            </Alert>
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Time Bonus:</strong> Complete all 5 levels perfectly (no mistypes, no skips) to earn +5 XP per remaining second!
              </AlertDescription>
            </Alert>
            <Alert>
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                <strong>Levels:</strong> Progress through 20, 50, 100, 200, and 500-word challenges. You can finish early on Level 5.
              </AlertDescription>
            </Alert>
            <div className="pt-4">
              <Button onClick={handleStart} size="lg" className="w-full">
                Start Challenge
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={onReturn} variant="outline" size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            Return to Menu
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete && completionMetrics) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Trophy className="w-16 h-16 mx-auto text-chart-1" />
          <h2 className="text-3xl font-bold">Challenge Complete!</h2>
          <p className="text-muted-foreground">{getCompletionMessage()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Final Score</CardTitle>
            <CardDescription>Your performance summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <p className="text-5xl font-bold text-primary">{completionMetrics.xpEarned} XP</p>
              <p className="text-muted-foreground mt-2">Total XP Earned</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{completionMetrics.accuracyPercent.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{completionMetrics.wpm}</p>
                <p className="text-sm text-muted-foreground">Words Per Minute</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{completionMetrics.correctWords}</p>
                <p className="text-sm text-muted-foreground">Correct Words</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{completionMetrics.mistypedWords}</p>
                <p className="text-sm text-muted-foreground">Mistyped Words</p>
              </div>
              {completionMetrics.untypedWords > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg text-center col-span-2">
                  <p className="text-2xl font-bold">{completionMetrics.untypedWords}</p>
                  <p className="text-sm text-muted-foreground">Untyped Words</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={onReturn} size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            Return to Menu
          </Button>
        </div>
      </div>
    );
  }

  const isLastLevel = currentLevel === LEVELS.length - 1;

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Level {currentLevel + 1} of {LEVELS.length}</h2>
            <p className="text-muted-foreground">{currentLevelData.wordCount} words</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Clock className="w-6 h-6" />
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-muted-foreground">Current XP: {xp}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Type the following text:</CardTitle>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-lg leading-relaxed font-mono">{currentLevelData.text}</p>
            </div>
            <div>
              <Input
                ref={inputRef}
                value={userInput}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onContextMenu={handleContextMenu}
                placeholder="Start typing here..."
                className="text-lg font-mono"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Tooltip open={showExceededTooltip}>
                <TooltipTrigger asChild>
                  <span className={`flex items-center gap-2 ${hasExceededWords ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                    {hasExceededWords && <AlertTriangle className="w-4 h-4" />}
                    Words typed: {typedWords.length} / {requiredWords}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-destructive text-destructive-foreground">
                  <p className="font-semibold">⚠️ Exceeded required words!</p>
                  <p className="text-sm">You've typed more than {requiredWords} words.</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-muted-foreground">Progress: {Math.round(progress)}%</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          {isLastLevel ? (
            <Button
              onClick={handleFinish}
              variant="default"
              size="lg"
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Finish
            </Button>
          ) : (
            <Button
              onClick={handleNextLevel}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Next Level
            </Button>
          )}
        </div>

        <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Skip to Next Level?</AlertDialogTitle>
              <AlertDialogDescription>
                You haven't typed the required {requiredWords} words yet. Skipping will save your current progress but you'll miss out on potential XP. Note: Skipping disqualifies you from the time bonus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSkipLevel}>
                Skip
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
