import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import React, { useState } from 'react';
import { PollContents } from '../../lib/collections/polls/schema';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles =>  ({
  root: {
  }
})

const PollNewForm = ({classes}: {
  classes: ClassesType
}) => {
  const [question, setQuestion] = useState('')
  const [poll, setPoll] = useState<PollContents>({type: "MultipleChoice", value: {options: []}})
  
  return <div>
    <Input value={question} onChange={event => setQuestion(event.target.value)} />

    {poll.value.options.map((option, index) => {
      return <div>
        <Input key={index} value={option} onChange={ev => setPoll({
          ...poll,
          value: {
            ...poll.value,
            options: replaceInArray(poll.value.options, index, ev.target.value)
          }
        })} />
        <span onClick={() => setPoll({
          ...poll,
          value: {
            ...poll.value,
            options: [...poll.value.options.slice(0, index), ...poll.value.options.slice(index+1)]
          }
        })}>X</span>
      </div>
    })}
    
    <Button onClick={() => setPoll({
      ...poll,
      value: {
        ...poll.value,
        options: [...poll.value.options, '']
      }
    })}>New option</Button>
  </div>
};


export function replaceInArray<T>(array: Array<T>, index: number, newValue: T): Array<T> {
  let clone = [...array]
  clone[index] = newValue
  return clone
}

const PollNewFormComponent = registerComponent('PollNewForm', PollNewForm, { styles });

declare global {
  interface ComponentTypes {
    PollNewForm: typeof PollNewFormComponent
  }
}
