import React from 'react';
import { Checkbox, FormControlLabel, Paper, Typography } from '@material-ui/core';

const ParticipantCheckboxes = ({ conversation, currentUser }:{conversation: ConversationsList, currentUser: UsersCurrent}) => {
    const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked({ ...checked, [event.target.name]: event.target.checked });
  };

  return (
    <Paper style={{ padding: '1em' }}>
      <Typography variant="body1">Check your box to indicate you'd like to start a dialogue. (If all boxes are checked then a dialogue will begin.)</Typography>
      {conversation.participants.map((participant) => {
          return (
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked[participant._id] || false}
                  onChange={handleChange}
                  name={participant._id}
                  color="primary"
                />
              }
              label={participant.displayName}
              key={participant._id}
            />
          );
      })}
    </Paper>
  );
};

export default ParticipantCheckboxes;