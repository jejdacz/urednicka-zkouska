import { useEffect, useState, memo } from 'react';
import classnames from 'classnames';
import './App.scss';
import exam from './exam.json';
import classNames from 'classnames';

const Answer = ({ text, onClick, selected, valid }) => {
  return (
    <div
      className={classnames('answer', 'button', {
        selected,
        valid,
        invalid: !valid
      })}
      onClick={onClick}>
      {text}
    </div>
  );
};

const Question = ({ text }) => <div className='question'>{text}</div>;

//exam.questions = exam.questions.splice(0, 3);

const initAvailableQuestionsIndexes = exam.questions.map((e, i) => i);

const initialState = {
  status: 'init',
  currentQuestionIndex: null,
  selectedAnswer: null,
  showRight: false,
  showControls: false,
  learnedLimit: 5,
  availableQuestionsIndexes: initAvailableQuestionsIndexes,
  stats: {
    answers: new Array(exam.questions.length).fill(0),
    rightAnswers: 0,
    totalAnswers: 0,
    removedQuestions: 0
  }
};

const loadState = () =>
  localStorage.state ? JSON.parse(localStorage.state) : null;
const saveState = state => {
  localStorage.state = JSON.stringify(state);
  return state;
};

const App = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // load local stats
    const state = loadState() ?? { status: 'loaded' };
    console.log('loading state from localstorage');
    setState(s => ({ ...s, ...state }));
  }, []);

  useEffect(() => {
    if (state.status === 'loaded') {
      setState(s => ({
        ...s,
        currentQuestionIndex: pickQuestionIndex(),
        status: 'ready'
      }));
    } else if (state.status === 'ready') {
      saveState(state);
    } else if (state.status === 'right') {
      // calculate stats here

      setState(s => {
        const answers = s.stats.answers.slice();
        answers[s.currentQuestionIndex]++;

        return {
          ...s,
          availableQuestionsIndexes:
            answers[s.currentQuestionIndex] >= state.learnedLimit
              ? s.availableQuestionsIndexes.filter(
                  e => e !== s.currentQuestionIndex
                )
              : s.availableQuestionsIndexes,
          stats: {
            ...s.stats,
            answers,
            rightAnswers: s.stats.rightAnswers + 1,
            totalAnswers: s.stats.totalAnswers + 1
          }
        };
      });
      setTimeout(
        () => setState(s => ({ ...s, status: 'showRight', showRight: true })),
        500
      );
    } else if (state.status === 'wrong') {
      // calculate stats here
      setState(s => ({
        ...s,
        stats: { ...s.stats, totalAnswers: s.stats.totalAnswers + 1 }
      }));
      setTimeout(
        () => setState(s => ({ ...s, status: 'showRight', showRight: true })),
        500
      );
    } else if (state.status === 'showRight') {
      // handle victory
      state.availableQuestionsIndexes.length > 0
        ? setTimeout(
            () => setState(s => ({ ...s, status: 'waitingForClick' })),
            500
          )
        : setState(s => ({ ...s, status: 'victory' }));
    } else if (state.status === 'goingNext') {
      setTimeout(
        () =>
          setState(s => ({
            ...s,
            showRight: false,
            selectedAnswer: null,
            currentQuestionIndex: pickQuestionIndex(),
            status: 'ready'
          })),
        500
      );
    }
  }, [state.status]);

  const pickQuestionIndex = () =>
    state.availableQuestionsIndexes[
      Math.floor(Math.random() * state.availableQuestionsIndexes.length)
    ];

  const handleAnswer = i => () => {
    if (state.status === 'ready')
      exam.questions[state.currentQuestionIndex].answers[i].valid
        ? setState(s => ({ ...s, selectedAnswer: i, status: 'right' }))
        : setState(s => ({ ...s, selectedAnswer: i, status: 'wrong' }));
  };

  const handleAppClick = () => {
    if (state.status === 'waitingForClick') {
      setState(s => ({ ...s, status: 'goingNext' }));
    }
  };

  const handleShowAllClick = () => {
    state.status !== 'showAll'
      ? setState(s => ({ ...s, showRight: true, status: 'showAll' }))
      : setState(s => ({ ...s, showRight: false, status: 'ready' }));
  };

  const renderQuestion = () =>
    state.status === 'ready' ||
    state.status === 'wrong' ||
    state.status === 'right' ||
    state.status === 'showRight' ||
    state.status === 'waitingForClick' ||
    state.status === 'goingNext' ? (
      <div
        className={classNames('question-wrapper', {
          'going-next': state.status === 'goingNext'
        })}>
        <Question text={exam.questions[state.currentQuestionIndex].question} />
        {exam.questions[state.currentQuestionIndex].answers.map((e, i) => (
          <Answer
            key={i}
            text={e.text}
            onClick={handleAnswer(i)}
            selected={state.selectedAnswer === i || state.showRight}
            valid={e.valid}
          />
        ))}
      </div>
    ) : null;

  const renderAll = () =>
    state.status === 'showAll' ? (
      <>
        {exam.questions.map((q, iq) => (
          <div key={iq} className='question-wrapper'>
            <Question key={iq} text={`${q.id}. ${q.question}`} />
            {q.answers.map((e, i) => (
              <Answer
                key={`${iq}-${i}`}
                text={e.text}
                selected={e.valid}
                valid={e.valid}
              />
            ))}
          </div>
        ))}
      </>
    ) : null;

  return (
    <div
      className={classNames('app', {
        'waiting-for-click': state.status === 'waitingForClick'
      })}
      onClick={handleAppClick}>
      <div className='status-bar'>
        <div className='wrapper'>
          <div className='button answers-right'>
            {`r: ${state.stats.rightAnswers}`}
          </div>
          <div className='button answers-total'>
            {`tot: ${state.stats.totalAnswers}`}
          </div>
          <div className='button answers-ratio'>
            {`r/t: ${(
              state.stats.rightAnswers / state.stats.totalAnswers
            ).toFixed(2)}`}
          </div>
          <div className='button answers-remaining'>
            {`rem: ${state.availableQuestionsIndexes.length}`}
          </div>
          <div className='button primary' onClick={handleShowAllClick}>
            {state.status === 'showAll' ? 'practice' : 'show all'}
          </div>
        </div>
      </div>
      {renderQuestion()}
      {state.status === 'victory' && (
        <div className='victory-wrapper'>
          <h1 className='sign'>VICTORY!</h1>
        </div>
      )}
      {state.showControls && (
        <div className='controls'>
          <div className='button'>&lt;</div>
          <div className='button'>&gt;</div>
        </div>
      )}
      {renderAll()}
    </div>
  );
};

export default App;
