"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2 } from "lucide-react";
import Particles from "@/components/ui/particles";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";

import { words } from "@/constants/words";
import { sampleSentences } from "@/constants/sampleSentences";

export default function ImprovedTypingSpeedTester() {
  const [gameState, setGameState] = useState<"typing" | "result">("typing");
  const [currentWords, setCurrentWords] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [testDuration, setTestDuration] = useState(15);
  const [timeLeft, setTimeLeft] = useState(testDuration);
  const [testWordCount, setTestWordCount] = useState(10);
  const [performanceData, setPerformanceData] = useState<
    { time: number; wpm: number; accuracy: number }[]
  >([]);
  const [characterAccuracy, setCharacterAccuracy] = useState<boolean[]>([]);
  const [wordStatuses, setWordStatuses] = useState<boolean[]>([]);

  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);

  const [testMode, setTestMode] = useState<"time" | "words">("time");

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Toogles
  const [showPerformance, setShowPerformance] = useState(true);
  const [showCharacterAccuracyIndicator, setShowCharacterAccuracyIndicator] =
    useState(true);

  // Refs to store the wpm and accuracy without causing re-renders
  const wpmRef = useRef(wpm);
  const accuracyRef = useRef(accuracy);

  // Refs for shortcut detection
  const tabPressedRef = useRef(false);
  const tabTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateWords(50); // Initialize with a larger number of words

    // Measure container width for dynamic centering
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      window.addEventListener("resize", handleResize);
    }

    // Add global keydown listener for shortcuts
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleResize = () => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  };

  // Update refs whenever wpm or accuracy changes
  useEffect(() => {
    wpmRef.current = wpm;
    accuracyRef.current = accuracy;
  }, [wpm, accuracy]);

  useEffect(() => {
    if (gameState === "typing" && startTime !== 0 && testMode === "time") {
      const timer = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          const newTimeLeft = prevTimeLeft - 1;

          if (newTimeLeft <= 0) {
            clearInterval(timer);
            endGame();
            return 0;
          }

          // Update performance data every 5 seconds
          const timeElapsed = testDuration - newTimeLeft;
          if (timeElapsed > 0 && timeElapsed % 5 === 0) {
            setPerformanceData((prev) => [
              ...prev,
              {
                time: timeElapsed,
                wpm: wpmRef.current,
                accuracy: accuracyRef.current,
              },
            ]);
          }

          return newTimeLeft;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState, startTime, testDuration, testMode]);

  // Focus the input element on initial page load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (gameState === "typing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Handler for global keydown events to detect Tab + Enter
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      tabPressedRef.current = true;

      // Start a timer to reset the tabPressed flag
      if (tabTimerRef.current) {
        clearTimeout(tabTimerRef.current);
      }
      tabTimerRef.current = setTimeout(() => {
        tabPressedRef.current = false;
      }, 500); // 500ms window for Enter to be pressed after Tab
    } else if (e.key === "Enter" && tabPressedRef.current) {
      e.preventDefault();
      resetGame();
      tabPressedRef.current = false;
      if (tabTimerRef.current) {
        clearTimeout(tabTimerRef.current);
      }
    }
  };

  const generateWords = useCallback(
    (count = 10) => {
      let newWords: string[] = [];

      if (includePunctuation) {
        while (newWords.length < count) {
          const sentence =
            sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
          let wordsInSentence = sentence.split(" ");

          if (!includeNumbers) {
            // Remove words that are numbers
            wordsInSentence = wordsInSentence.filter(
              (word) => !/\d/.test(word)
            );
          }

          newWords.push(...wordsInSentence);
        }
      } else {
        const wordPool = [...words];

        if (includeNumbers) {
          wordPool.push(...Array.from({ length: 10 }, (_, i) => i.toString()));
        }

        newWords = Array(count)
          .fill(null)
          .map(() => wordPool[Math.floor(Math.random() * wordPool.length)]);
      }

      setCurrentWords((prevWords) => [
        ...prevWords,
        ...newWords.slice(0, count),
      ]);
    },
    [includePunctuation, includeNumbers]
  );

  // useEffect to reset state when options change
  useEffect(() => {
    if (gameState === "typing") {
      setCurrentWords([]);
      setWordIndex(0);
      setUserInput("");
      setCharacterAccuracy([]);
      setWordStatuses([]);
      generateWords(50);
    }
  }, [
    includePunctuation,
    includeNumbers,
    gameState,
    generateWords,
    testMode,
    testWordCount,
  ]);

  const startGame = () => {
    setStartTime(Date.now());
    if (testMode === "time") {
      setTimeLeft(testDuration);
    }
    if (inputRef.current) inputRef.current.focus();
  };

  const endGame = () => {
    setGameState("result");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (startTime === 0) startGame();

    const inputValue = e.target.value;
    setUserInput(inputValue);

    // Update character accuracy
    const currentWord = currentWords[wordIndex];
    const newCharacterAccuracy = inputValue
      .split("")
      .map((char, index) => char === currentWord[index]);
    setCharacterAccuracy(newCharacterAccuracy);

    if (inputValue.endsWith(" ")) {
      const typedWord = inputValue.trim();
      const isCorrect = typedWord === currentWords[wordIndex];

      setWordStatuses((prevStatuses) => [...prevStatuses, isCorrect]);
      const newCorrectWords = isCorrect ? correctWords + 1 : correctWords;
      const newWordIndex = wordIndex + 1;

      setCorrectWords(newCorrectWords);
      setWordIndex(newWordIndex);
      setUserInput("");
      setCharacterAccuracy([]);

      // Append new words if nearing the end
      if (newWordIndex >= currentWords.length - 20) {
        generateWords(10);
      }

      // Calculate WPM and accuracy
      const timeElapsed = (Date.now() - startTime) / 60000;
      const newWpm = Math.round(newCorrectWords / timeElapsed || 0);
      const newAccuracy =
        newWordIndex > 0
          ? Math.round((newCorrectWords / newWordIndex) * 100)
          : 100;
      setWpm(newWpm);
      setAccuracy(newAccuracy);

      // For word count mode, check if the test is over
      if (testMode === "words" && newWordIndex >= testWordCount) {
        endGame();
      }
    }
  };

  const resetGame = () => {
    setGameState("typing");
    setCurrentWords([]);
    setWordIndex(0);
    setCorrectWords(0);
    setStartTime(0);
    setWpm(0);
    setAccuracy(100);
    if (testMode === "time") {
      setTimeLeft(testDuration);
    }
    setPerformanceData([]);
    setCharacterAccuracy([]);
    setUserInput("");
    setWordStatuses([]);
    generateWords(50);
  };

  const handleDurationChange = (value: string) => {
    const duration = parseInt(value);
    setTestDuration(duration);
    setTimeLeft(duration);
    resetGame();
  };

  const handleWordCountChange = (value: string) => {
    const wordCount = parseInt(value);
    setTestWordCount(wordCount);
    resetGame();
  };

  const calculateTranslateX = () => {
    const wordWidth = 120;
    const centerPosition = containerWidth / 2;
    const targetPosition = wordIndex * wordWidth + wordWidth / 2;
    return centerPosition - targetPosition;
  };

  return (
    <div className="h-screen flex flex-col relative bg-gray-100">
      <Particles
        className="absolute inset-0"
        quantity={100}
        ease={200}
        color="#000000"
        refresh
      />
      <div className="mx-auto p-4 flex flex-col items-center justify-center w-full h-full z-10">
        {gameState === "typing" && (
          <>
            <div className="mb-4 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-2">
                {testMode === "time" ? (
                  <div className="text-2xl font-bold">
                    Time left: {timeLeft}s
                  </div>
                ) : (
                  <div className="text-2xl font-bold">
                    Words left: {testWordCount - wordIndex}
                  </div>
                )}
                <div className="flex space-x-2">
                  {/* Mode Selector */}
                  <Select
                    value={testMode}
                    onValueChange={(value) => {
                      setTestMode(value as "time" | "words");
                      resetGame();
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time Mode</SelectItem>
                      <SelectItem value="words">Word Mode</SelectItem>
                    </SelectContent>
                  </Select>

                  {testMode === "time" ? (
                    <Select
                      value={testDuration.toString()}
                      onValueChange={handleDurationChange}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="120">120 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={testWordCount.toString()}
                      onValueChange={handleWordCountChange}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select word count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 words</SelectItem>
                        <SelectItem value="25">25 words</SelectItem>
                        <SelectItem value="50">50 words</SelectItem>
                        <SelectItem value="100">100 words</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {testMode === "time" ? (
                <Progress
                  value={(timeLeft / testDuration) * 100}
                  className="w-full"
                />
              ) : (
                <Progress
                  value={100 - (wordIndex / testWordCount) * 100}
                  className="w-full"
                />
              )}
            </div>

            {/* Options for Punctuation, Numbers, and Performance Display */}
            <div className="mb-4 w-full max-w-2xl flex justify-center space-x-4">
              <Button
                variant={includePunctuation ? "default" : "outline"}
                onClick={() => {
                  setIncludePunctuation(!includePunctuation);
                  inputRef.current?.focus();
                }}
              >
                {includePunctuation ? "Disable" : "Enable"} Punctuation
              </Button>
              <Button
                variant={includeNumbers ? "default" : "outline"}
                onClick={() => {
                  setIncludeNumbers(!includeNumbers);
                  inputRef.current?.focus();
                }}
              >
                {includeNumbers ? "Disable" : "Enable"} Numbers
              </Button>
              <Button
                variant={showPerformance ? "default" : "outline"}
                onClick={() => {
                  setShowPerformance(!showPerformance);
                  inputRef.current?.focus();
                }}
              >
                {showPerformance ? "Hide" : "Show"} WPM & Accuracy
              </Button>
              {/* Button to toggle character accuracy indicator */}
              <Button
                variant={showCharacterAccuracyIndicator ? "default" : "outline"}
                onClick={() => {
                  setShowCharacterAccuracyIndicator(
                    !showCharacterAccuracyIndicator
                  );
                  inputRef.current?.focus();
                }}
              >
                {showCharacterAccuracyIndicator ? "Hide" : "Show"} Character
                Accuracy
              </Button>
            </div>

            {/* Continuous Infinite Strip of Words with Centered Current Word */}
            <div
              ref={containerRef}
              className="relative h-24 overflow-hidden rounded-lg w-full max-w-2xl z-10"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(243, 244, 246, 0) 0%, rgba(243, 244, 246, 1) 25%, rgba(243, 244, 246, 1) 75%, rgba(243, 244, 246, 0) 100%)",
              }}
            >
              <div className="absolute left-0 h-full w-[20px] bg-gradient-to-r from-gray-100 to-transparent z-10"></div>
              <div className="absolute right-0 h-full w-[20px] bg-gradient-to-r from-transparent to-gray-100 z-10"></div>
              <div
                className="absolute whitespace-nowrap flex items-center h-full transition-transform duration-100 text-lg"
                style={{
                  transform: `translateX(${calculateTranslateX()}px)`,
                }}
              >
                {currentWords.map((word, index) => (
                  <span
                    key={index}
                    className={`inline-block w-[120px] text-center ${
                      index < wordIndex
                        ? wordStatuses[index]
                          ? "text-green-500"
                          : "text-red-500"
                        : index === wordIndex
                        ? "text-primary font-bold text-2xl"
                        : "text-muted-foreground text-lg"
                    }`}
                  >
                    {index === wordIndex
                      ? // If it's the current word being typed, split into characters
                        word.split("").map((char, charIndex) => (
                          <span
                            key={charIndex}
                            className={`inline-block ${
                              charIndex < characterAccuracy.length
                                ? characterAccuracy[charIndex]
                                  ? "text-green-500"
                                  : "text-red-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {char}
                          </span>
                        ))
                      : // For other words, display normally
                        word}
                  </span>
                ))}
              </div>
            </div>

            {/* Character Accuracy Indicators */}
            {showCharacterAccuracyIndicator && (
              <div className="mb-4 text-center min-h-8">
                {characterAccuracy.map((isCorrect, index) => (
                  <span
                    key={index}
                    className={`inline-block w-4 h-4 mx-0.5 rounded-full ${
                      isCorrect ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Input Field w/o UI */}
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              style={{ position: "absolute", left: "-9999px" }}
              aria-label="Type the words shown above"
            />

            {/* Conditionally render WPM and Accuracy */}
            {showPerformance && (
              <div className="grid grid-cols-2 gap-4 text-center w-full max-w-2xl">
                <div>
                  <div className="text-3xl font-bold text-primary">{wpm}</div>
                  <div className="text-sm text-gray-600">WPM</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {accuracy}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
              </div>
            )}
          </>
        )}
        {gameState === "result" && (
          <>
            <div className="text-center mb-6 w-full max-w-2xl">
              <h2 className="text-3xl font-bold mb-4">Results</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-4xl font-bold text-primary">{wpm}</p>
                  <p className="text-lg text-gray-600">Words per Minute</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary">{accuracy}%</p>
                  <p className="text-lg text-gray-600">Accuracy</p>
                </div>
              </div>
            </div>
            <Button onClick={resetGame} className="w-full max-w-2xl">
              Try Again
            </Button>
          </>
        )}

        {/* Footer with Shortcut Information */}
        <footer className="mt-8 w-full max-w-2xl text-center text-sm text-gray-500">
          Press <kbd className="font-mono bg-gray-200 px-1 rounded">Tab</kbd> +{" "}
          <kbd className="font-mono bg-gray-200 px-1 rounded">Enter</kbd> to
          restart the game.
        </footer>
      </div>
      <a
        className="absolute bottom-0 w-full flex justify-center pb-8 cursor-pointer z-10"
        href="https://github.com/basith-ahmed/type-racer"
        target="_blank"
        rel="noopener noreferrer"
      >
        <AnimatedGradientText className="backdrop-blur-lg">
          <div className="hover:underline text-sm flex justify-center items-center">
            View on GitHub
            <Link2 className="w-4 h-4 ml-1" />
          </div>
        </AnimatedGradientText>
      </a>
    </div>
  );
}
