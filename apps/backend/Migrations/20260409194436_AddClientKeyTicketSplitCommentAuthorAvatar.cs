using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisoHelp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClientKeyTicketSplitCommentAuthorAvatar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "client_provided_description",
                table: "tickets",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "author_analyst_id",
                table: "ticket_comments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "author_name",
                table: "ticket_comments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "is_from_client",
                table: "ticket_comments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "public_code",
                table: "clients",
                type: "character varying(5)",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "avatar_data_url",
                table: "analysts",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ticket_comments_author_analyst_id",
                table: "ticket_comments",
                column: "author_analyst_id");

            migrationBuilder.CreateIndex(
                name: "IX_clients_tenant_id_public_code",
                table: "clients",
                columns: new[] { "tenant_id", "public_code" },
                unique: true,
                filter: "public_code IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_ticket_comments_analysts_author_analyst_id",
                table: "ticket_comments",
                column: "author_analyst_id",
                principalTable: "analysts",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.Sql(
                """
                UPDATE tickets
                SET client_provided_description = description
                WHERE client_provided_description IS NULL AND description IS NOT NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE ticket_comments
                SET author_name = 'Equipe interna'
                WHERE author_name = '' OR author_name IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ticket_comments_analysts_author_analyst_id",
                table: "ticket_comments");

            migrationBuilder.DropIndex(
                name: "IX_ticket_comments_author_analyst_id",
                table: "ticket_comments");

            migrationBuilder.DropIndex(
                name: "IX_clients_tenant_id_public_code",
                table: "clients");

            migrationBuilder.DropColumn(
                name: "client_provided_description",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "author_analyst_id",
                table: "ticket_comments");

            migrationBuilder.DropColumn(
                name: "author_name",
                table: "ticket_comments");

            migrationBuilder.DropColumn(
                name: "is_from_client",
                table: "ticket_comments");

            migrationBuilder.DropColumn(
                name: "public_code",
                table: "clients");

            migrationBuilder.DropColumn(
                name: "avatar_data_url",
                table: "analysts");
        }
    }
}
