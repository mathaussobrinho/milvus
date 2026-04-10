using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisoHelp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceClientAndInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "antivirus_summary",
                table: "devices",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "client_id",
                table: "devices",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "total_disk_gb",
                table: "devices",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "total_ram_mb",
                table: "devices",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_devices_client_id",
                table: "devices",
                column: "client_id");

            migrationBuilder.AddForeignKey(
                name: "FK_devices_clients_client_id",
                table: "devices",
                column: "client_id",
                principalTable: "clients",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_devices_clients_client_id",
                table: "devices");

            migrationBuilder.DropIndex(
                name: "IX_devices_client_id",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "antivirus_summary",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "client_id",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "total_disk_gb",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "total_ram_mb",
                table: "devices");
        }
    }
}
