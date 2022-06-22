import React from "react";
import Die from "./components/Die/Die";
import StopWatch from "./components/Stopwatch/Stopwatch";
import Counter from "./components/Counter/Counter";
import Timer from "./components/Timer/Timer";
import Ready from "./components/Ready/Ready";
import Confetti from "react-confetti";
import { nanoid } from "nanoid";
import { SplitTime } from "./Helper/utils.module";
import ModalComponent from "./components/Modal/ModalComponent";
import { ModalProvider } from "styled-react-modal";
import GlobalStyle from "./GlobalStyles";
import { useMediaQuery } from "react-responsive";
import devices from "./Helper/devices";

import {
  Container,
  CounterTimerContainer,
  DiceContainer,
  Frame,
  InnerContainer,
  Title,
  Instruction,
  Congrats,
  ButtonContainer,
  Button,
  BestRecordDiv,
} from "./GlobalStyles";
import { useLocalStorage } from "./Helper/hooks";

export default function Home() {
  const [isWon, setIsWon] = React.useState(false);
  const [readyBanner, setReadyBanner] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const [showDialogbox, setShowDialogbox] = React.useState(false);
  const isLongMobiles = useMediaQuery({
    query: `(${devices.longsL}) and (${devices.longsU}) and (${devices.mobiles})`,
  });

  const [bestRecord, setBestRecord] = useLocalStorage("recordedTimeObj", null);

  //------------------------ Stopwatch Part ----------------------

  const [isActive, setIsActive] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [time, setTime] = React.useState(0);

  React.useEffect(() => {
    let interval = null;

    if (isActive && !isPaused && !isWon) {
      interval = setInterval(
        () => {
          setTime((prevTime) => prevTime + 1);
        },
        10
        // It says: do the function every 10/1000 = 1/100 seconds
        //For showing centiseconds, we need to devide 1 second to 100 parts, so every second is composed of 100*(1/100 second)
      );
    } else {
      if (isWon && time !== 0) {
        // If the player wins and they have played with timer:
        CheckForTheNewRecord();
      }

      clearInterval(interval);
    }
    return () => {
      clearInterval(interval);
      // To avoid memory leak
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPaused, isWon]);

  function startHandler() {
    setTime(0);
    setCount(0);
    setIsActive(true);
    setIsPaused(false);
    setIsWon(false);
    setDiceObjsArray(createObjsArray());
  }

  function pauseResumeHandler() {
    setIsPaused(!isPaused);
  }

  function resetHandler() {
    setTime(0);
    setCount(0);
    setIsPaused(false);
    setIsActive(false);
    setIsWon(false);
    setDiceObjsArray(createObjsArray());
  }

  //----------------------- Main Part -------------------------
  const [diceObjsArray, setDiceObjsArray] = React.useState(createObjsArray());
  const diceElements = diceObjsArray.map((item) => (
    <Die
      key={item.id}
      value={item.value}
      isHeld={item.isHeld}
      clickHandler={() => dieClickHandler(item.id)}
    />
  ));

  React.useEffect(() => {
    const allHeld = diceObjsArray.every((item) => item.isHeld);
    const firstValue = diceObjsArray[0].value;
    const allEqualValue = diceObjsArray.every(
      (item) => item.value === firstValue
    );

    allHeld && allEqualValue && setIsWon(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, diceObjsArray);

  function createRandomNum() {
    return Math.ceil(Math.random() * 6);
    // Math.random(x) :returns a pseudo-random number that 0=< x <1
    // Math.floor(x) : teturns the greates integer <=x
    // Math.ceil(x) : teturns the smallest integer > x
  }

  function createDieObject() {
    return {
      id: nanoid(),
      value: createRandomNum(),
      isHeld: false,
    };
  }

  function createObjsArray() {
    const array = [];
    for (let i = 0; i < 10; i++) {
      array.push(createDieObject());
    }
    return array;
  }

  function rollNewDice() {
    if (isWon) {
      // The button text is: Back To Menu
      setIsWon(false);
      setDiceObjsArray(createObjsArray());
      resetHandler();
    } else {
      //The button text is: Roll

      if (!isPaused) {
        setCount((prevCount) => prevCount + 1);
        setDiceObjsArray((prevArray) => {
          return prevArray.map((item) => {
            return item.isHeld ? item : createDieObject();
          });
        });
      } else setShowDialogbox(true);
    }
  }

  function tryAgain() {
    setReadyBanner(true);
  }

  function yes() {
    setReadyBanner(false);
    startHandler();
  }

  function cancel() {
    setReadyBanner(false);
    resetHandler();
  }

  function dieClickHandler(id) {
    if (!isPaused) {
      setDiceObjsArray((prevArray) => {
        return prevArray.map((item) => {
          return item.id === id ? { ...item, isHeld: !item.isHeld } : item;
        });
      });
    } else {
      setShowDialogbox(true);
    }
  }

  //------------------- Saving Best Record in Local Storage --------------------

  function CheckForTheNewRecord() {
    const minute = SplitTime(time).minute;
    const second = SplitTime(time).second;
    const centisecond = SplitTime(time).centisecond;

    const currentTimeObject = {
      minute: minute,
      second: second,
      centisecond: centisecond,
    };

    // I have removed some of these, since we are unnecesary reading the store multiple times here
    // bestRecord itself is the up do to date state in our component, we don't need to read it from the store
    if (bestRecord !== null) {
      // Comparison between current time and the user's record
      if (parseInt(currentTimeObject.minute) < parseInt(bestRecord.minute)) {
        saveNewRecord();
      } else {
        if (
          parseInt(currentTimeObject.minute) === parseInt(bestRecord.minute)
        ) {
          if (
            parseInt(currentTimeObject.second) < parseInt(bestRecord.second)
          ) {
            saveNewRecord();
          } else {
            if (
              parseInt(currentTimeObject.second) === parseInt(bestRecord.second)
            ) {
              if (
                parseInt(currentTimeObject.centisecond) <
                parseInt(bestRecord.centisecond)
              ) {
                saveNewRecord();
              }
            }
          }
        }
      }
    } else {
      setBestRecord(currentTimeObject);
    }

    function saveNewRecord() {
      setBestRecord(currentTimeObject);
    }
  }

  //------------------- Change showDialogbox State -------------------
  function closeDialogboxHandler() {
    setShowDialogbox(false);
  }

  // ----------------- Return ------------------
  return (
    <div>
      <GlobalStyle />
      <Container>
        <Frame>
          <InnerContainer>
            <CounterTimerContainer className="row-1">
              {/*-------------- Counter /*--------------*/}

              <Counter count={count} />
              {/*-------------- Timer --------------*/}

              <Timer time={time} />
            </CounterTimerContainer>

            {/*---------- Title ---------*/}
            <Title className="row-1">Tenzies</Title>

            {/*---------- Instraction ---------*/}

            <Instruction className="row-1">
              Roll until all dice are the same. Click each die to freeze it at
              its current value between rolls.
            </Instruction>

            {/*---------- Ready And Dice Container ---------*/}

            {readyBanner ? (
              <Ready yesClickHandler={yes} cancelClickHandler={cancel} />
            ) : (
              <DiceContainer className={isLongMobiles ? "row-2" : "row-3"}>
                {diceElements}
              </DiceContainer>
            )}

            {/*---------- Congrats  ---------*/}

            {!readyBanner && isWon && (
              <Congrats className="row-1">Congrats!🎉 You Won!</Congrats>
            )}

            {/*---------- Roll, Back To Menu, Try again Buttons  ---------*/}

            {!readyBanner && (
              <ButtonContainer className="row-1">
                {
                  <Button onClick={rollNewDice}>
                    {isWon ? "Back To Menu" : "Roll"}
                  </Button>
                }

                {isWon && (
                  <Button onClick={tryAgain}>Try again with timer</Button>
                )}
              </ButtonContainer>
            )}

            {/*---------- Stopwatch Container Call ---------*/}

            {!readyBanner && !isWon && (
              <StopWatch
                isActive={isActive}
                isPaused={isPaused}
                startHandler={startHandler}
                pauseResumeHandler={pauseResumeHandler}
                resetHandler={resetHandler}
                isWon={isWon}
                readyBanner={readyBanner}
              />
            )}

            {/*---------- Best Record Section ---------*/}

            {/* Initially we don't have a bestRecord so we guard our component, otherwise,
              we should expect the object to contain every data we need */}
            <BestRecordDiv className="row-1">
              {bestRecord
                ? `Your Best Record: ${bestRecord.minute}:${bestRecord.second}:${bestRecord.centisecond}`
                : `No record achieved yet!`}
            </BestRecordDiv>
          </InnerContainer>
          {/*---------- Confetti Lib ---------*/}
          {!readyBanner && isWon && (
            <Confetti height={window.innerHeight} width={window.innerWidth} />
          )}
          {/*---------- Dialog Box ----------*/}

          {showDialogbox && (
            <ModalProvider>
              <ModalComponent closeDialogboxHandler={closeDialogboxHandler} />
            </ModalProvider>
          )}
        </Frame>
      </Container>
    </div>
  );
}
