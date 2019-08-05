import React from 'react';
import Users from 'vulcan:users';
import { Components } from 'vulcan:core';

const AdminUsersEmail = ({ document: user }) =>
  <a href={`mailto:${Users.getEmail(user)}`}>{Users.getEmail(user)}</a>;

export default AdminUsersEmail;