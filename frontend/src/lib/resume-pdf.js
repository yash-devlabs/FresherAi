import { jsPDF } from "jspdf";
const MARGIN = 48;
const PAGE_W = 595.28; // A4 portrait, points
const PAGE_H = 841.89;
const WIDTH = PAGE_W - MARGIN * 2;
/** Renders a built resume to a clean single-column ATS-friendly PDF. */
export function downloadResumePdf(resume, contact) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = MARGIN;
    const ensure = (needed) => {
        if (y + needed > PAGE_H - MARGIN) {
            doc.addPage();
            y = MARGIN;
        }
    };
    const text = (value, opts = {}) => {
        const { size = 10, style = "normal", gap = 4, color = 40 } = opts;
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.setTextColor(color);
        const lines = doc.splitTextToSize(value, WIDTH);
        for (const line of lines) {
            ensure(size + 2);
            doc.text(line, MARGIN, y);
            y += size + 2;
        }
        y += gap;
    };
    const heading = (label) => {
        ensure(30);
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(90);
        doc.text(label.toUpperCase(), MARGIN, y);
        y += 6;
        doc.setDrawColor(200);
        doc.line(MARGIN, y, MARGIN + WIDTH, y);
        y += 12;
    };
    const bullet = (value) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(40);
        const lines = doc.splitTextToSize(value, WIDTH - 14);
        lines.forEach((line, i) => {
            ensure(14);
            if (i === 0)
                doc.text("•", MARGIN, y);
            doc.text(line, MARGIN + 14, y);
            y += 13;
        });
    };
    text(contact.fullName, { size: 20, style: "bold", gap: 2, color: 20 });
    if (resume.headline)
        text(resume.headline, { size: 11, color: 80, gap: 2 });
    const contactLine = [contact.email, contact.phone, contact.location, contact.links]
        .filter(Boolean)
        .join("  |  ");
    if (contactLine)
        text(contactLine, { size: 9, color: 120, gap: 2 });
    if (resume.summary) {
        heading("Summary");
        text(resume.summary);
    }
    if (resume.skills.length) {
        heading("Skills");
        text(resume.skills.join(" · "));
    }
    if (resume.experience.length) {
        heading("Experience");
        for (const e of resume.experience) {
            text(`${e.title} — ${e.organization}`, { style: "bold", gap: 0 });
            if (e.period)
                text(e.period, { size: 9, color: 120, gap: 2 });
            e.bullets.forEach(bullet);
            y += 6;
        }
    }
    if (resume.projects.length) {
        heading("Projects");
        for (const p of resume.projects) {
            text(p.name, { style: "bold", gap: 0 });
            text(p.description, { gap: 2 });
            if (p.tech.length)
                text(p.tech.join(", "), { size: 9, color: 120, gap: 6 });
        }
    }
    if (resume.education.length) {
        heading("Education");
        for (const e of resume.education) {
            text(e.degree, { style: "bold", gap: 0 });
            text([e.institution, e.period].filter(Boolean).join(" · "), {
                size: 9,
                color: 120,
                gap: 6,
            });
        }
    }
    if (resume.certifications.length) {
        heading("Certifications & Achievements");
        resume.certifications.forEach(bullet);
    }
    const slug = contact.fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume";
    doc.save(`${slug}-resume.pdf`);
}
