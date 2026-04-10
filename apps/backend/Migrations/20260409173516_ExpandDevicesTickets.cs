using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisoHelp.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandDevicesTickets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "tickets",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "device_id",
                table: "tickets",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("UPDATE tickets SET updated_at = created_at WHERE updated_at IS NULL");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "updated_at",
                table: "tickets",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "agent_key",
                table: "devices",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "client_name",
                table: "devices",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "mac_address",
                table: "devices",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.Sql("UPDATE devices SET agent_key = id::text WHERE agent_key IS NULL");
            migrationBuilder.Sql("UPDATE devices SET client_name = 'Nao informado' WHERE client_name IS NULL");
            migrationBuilder.Sql("UPDATE devices SET mac_address = '' WHERE mac_address IS NULL");

            migrationBuilder.AlterColumn<string>(
                name: "agent_key",
                table: "devices",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "client_name",
                table: "devices",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "mac_address",
                table: "devices",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_tickets_device_id",
                table: "tickets",
                column: "device_id");

            migrationBuilder.CreateIndex(
                name: "IX_devices_agent_key",
                table: "devices",
                column: "agent_key",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_tickets_devices_device_id",
                table: "tickets",
                column: "device_id",
                principalTable: "devices",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tickets_devices_device_id",
                table: "tickets");

            migrationBuilder.DropIndex(
                name: "IX_tickets_device_id",
                table: "tickets");

            migrationBuilder.DropIndex(
                name: "IX_devices_agent_key",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "description",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "device_id",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "agent_key",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "client_name",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "mac_address",
                table: "devices");
        }
    }
}
