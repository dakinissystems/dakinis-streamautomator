/**
 * Director mode — guided checklist for a live session (Mission Control).
 */

import { DataTypes } from 'sequelize';
import { sequelize } from '../../../config/database.js';

const StreamDirectorSession = sequelize.define(
  'StreamDirectorSession',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'live',
      comment: 'planned | live | completed | cancelled',
    },
    platform: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    steps: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of { id, label, kind, status, dueAt?, meta? }',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'StreamDirectorSessions',
    indexes: [{ fields: ['userId', 'status'] }],
  },
);

export default StreamDirectorSession;
