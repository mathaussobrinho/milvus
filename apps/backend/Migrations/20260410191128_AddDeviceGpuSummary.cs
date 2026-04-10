using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisoHelp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceGpuSummary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "gpu_summary",
                table: "devices",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "gpu_summary",
                table: "devices");
        }
    }
}
