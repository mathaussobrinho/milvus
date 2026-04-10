using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisoHelp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketAssigneeAnalyst : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "assignee_analyst_id",
                table: "tickets",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_tickets_assignee_analyst_id",
                table: "tickets",
                column: "assignee_analyst_id");

            migrationBuilder.AddForeignKey(
                name: "FK_tickets_analysts_assignee_analyst_id",
                table: "tickets",
                column: "assignee_analyst_id",
                principalTable: "analysts",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tickets_analysts_assignee_analyst_id",
                table: "tickets");

            migrationBuilder.DropIndex(
                name: "IX_tickets_assignee_analyst_id",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "assignee_analyst_id",
                table: "tickets");
        }
    }
}
