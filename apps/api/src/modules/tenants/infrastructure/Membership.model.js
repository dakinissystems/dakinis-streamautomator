import { DataTypes } from 'sequelize';
import { sequelize } from '../../../config/database.js';

/** Join table: Users ↔ tenants (SaaS). */
const Membership = sequelize.define(
  'Membership',
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'user_id',
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    tenantId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      field: 'tenant_id',
      allowNull: false,
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'member',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at',
    },
  },
  {
    tableName: 'memberships',
    timestamps: false,
  }
);

export default Membership;
