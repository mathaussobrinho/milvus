using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisoHelp.Api.Migrations
{
    /// <inheritdoc />
    public partial class TicketRequesterAndDeviceCpuBoot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "requester_department",
                table: "tickets",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "requester_email",
                table: "tickets",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "requester_name",
                table: "tickets",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "requester_phone",
                table: "tickets",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cpu_summary",
                table: "devices",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_os_boot_at",
                table: "devices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "devices",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "requester_department",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "requester_email",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "requester_name",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "requester_phone",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "cpu_summary",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "last_os_boot_at",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "notes",
                table: "devices");
        }
    }
}
