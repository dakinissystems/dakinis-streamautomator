import { DataTypes } from 'sequelize';
import { sequelize } from '../../../config/database.js';

const Tenant = sequelize.define(
  'Tenant',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    plan: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'free',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at',
    },
  },
  {
    tableName: 'tenants',
    timestamps: false,
  }
);

export default Tenant;
