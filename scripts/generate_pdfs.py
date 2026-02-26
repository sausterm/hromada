#!/usr/bin/env python3
"""
Hromada PDF Generator
Generates two professional PDFs:
  1. hromada_2pager.pdf — 2-page leave-behind for donor meetings
  2. hromada_6pager.pdf — 6-page deep-dive for institutional partners

Usage: python3 scripts/generate_pdfs.py
Output: docs/hromada_2pager.pdf, docs/hromada_6pager.pdf
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, Color
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Table, TableStyle

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
FONT_DIR = os.path.join(PROJECT_ROOT, "docs", "fonts")
LOGO_PATH = os.path.join(PROJECT_ROOT, "src", "app", "icon.png")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "docs")

# Partner / sponsor logos — white-bg variants blend on white PDF backgrounds
PARTNERS_DIR = os.path.join(PROJECT_ROOT, "public", "partners")
PARTNER_LOGOS = {
    "Ecoaction": os.path.join(PARTNERS_DIR, "EcoactionLogo-white.png"),
    "Ecoclub": os.path.join(PARTNERS_DIR, "EcoclubLogo-white.png"),
    "RePower Ukraine": os.path.join(PARTNERS_DIR, "RePowerUkraineLogo-white.png"),
    "Greenpeace CEE": os.path.join(PARTNERS_DIR, "greenpeacelogo-white.png"),
    "Energy Act For Ukraine": os.path.join(PARTNERS_DIR, "energyactukrainelogo-white.png"),
}
POCACITO_LOGO = os.path.join(PARTNERS_DIR, "pocacitologo-white.png")
CANDID_SEAL = os.path.join(PARTNERS_DIR, "candidseal.png")

# Logo native dimensions (width x height) for aspect ratio calculations
LOGO_DIMS = {
    "Ecoaction": (516, 242),
    "Ecoclub": (466, 138),
    "RePower Ukraine": (506, 186),
    "Greenpeace CEE": (512, 256),
    "Energy Act For Ukraine": (1330, 1330),
    "POCACITO": (750, 300),
    "Candid": (214, 216),
}

# ---------------------------------------------------------------------------
# Font registration
# ---------------------------------------------------------------------------
def setup_fonts():
    """Register Inter and Outfit font families."""
    fonts = {
        "Inter": "Inter-Regular.ttf",
        "Inter-SemiBold": "Inter-SemiBold.ttf",
        "Inter-Bold": "Inter-Bold.ttf",
        "Outfit": "Outfit-Regular.ttf",
        "Outfit-SemiBold": "Outfit-SemiBold.ttf",
        "Outfit-Bold": "Outfit-Bold.ttf",
    }
    registered = True
    for name, filename in fonts.items():
        path = os.path.join(FONT_DIR, filename)
        if os.path.exists(path):
            pdfmetrics.registerFont(TTFont(name, path))
        else:
            print(f"  Warning: {path} not found, falling back to Helvetica")
            registered = False

    if registered:
        # Register font families for automatic bold/italic resolution
        pdfmetrics.registerFontFamily(
            "Inter", normal="Inter", bold="Inter-Bold",
        )
        pdfmetrics.registerFontFamily(
            "Outfit", normal="Outfit", bold="Outfit-Bold",
        )
    return registered

# ---------------------------------------------------------------------------
# Brand constants
# ---------------------------------------------------------------------------
NAVY = HexColor("#2C3E50")
NAVY_80 = HexColor("#566D7E")
CREAM = HexColor("#F5F1E8")
CREAM_DARK = HexColor("#E2DCCE")
UKRAINE_BLUE = HexColor("#005BBB")
TERRACOTTA = HexColor("#D4754E")
GOLD = HexColor("#E6A855")
CHARCOAL = HexColor("#3A3633")
CHARCOAL_60 = HexColor("#807A73")
WHITE = white
LIGHT_BG = HexColor("#FAFAF7")
GREEN = HexColor("#3D7A4A")
RED_SOFT = HexColor("#B8493D")

# Category colors
CAT_HOSPITAL = HexColor("#C75B39")
CAT_SCHOOL = HexColor("#7B9E6B")
CAT_WATER = HexColor("#5B8FA8")
CAT_ENERGY = HexColor("#D4954A")
CAT_OTHER = HexColor("#8B7355")

# Layout
PAGE_W, PAGE_H = letter  # 612 x 792 points
MARGIN_L = 54  # 0.75"
MARGIN_R = 54
MARGIN_T = 54
MARGIN_B = 54
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# Fonts — set after registration
F_HEAD = "Outfit-Bold"
F_HEAD_SEMI = "Outfit-SemiBold"
F_HEAD_REG = "Outfit"
F_BODY = "Inter"
F_BODY_SEMI = "Inter-SemiBold"
F_BODY_BOLD = "Inter-Bold"


# ---------------------------------------------------------------------------
# Low-level drawing helpers
# ---------------------------------------------------------------------------

def hex_with_alpha(hex_color, alpha):
    """Create a semi-transparent version of a HexColor."""
    r, g, b = hex_color.red, hex_color.green, hex_color.blue
    return Color(r, g, b, alpha)


def wrap_text(c, text, font, size, max_width):
    """Split text into lines that fit within max_width. Returns list of strings."""
    words = text.split()
    lines = []
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if c.stringWidth(test, font, size) > max_width:
            if line:
                lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    return lines


def draw_text_block(c, x, y, text, font=None, size=10, color=CHARCOAL,
                    leading=None, max_width=None, align="left"):
    """Draw wrapped text. Returns y position after the last line."""
    if font is None:
        font = F_BODY
    if max_width is None:
        max_width = CONTENT_W
    if leading is None:
        leading = size * 1.55

    c.setFont(font, size)
    c.setFillColor(color)

    lines = wrap_text(c, text, font, size, max_width)
    for line in lines:
        if align == "center":
            c.drawCentredString(x + max_width / 2, y, line)
        elif align == "right":
            c.drawRightString(x + max_width, y, line)
        else:
            c.drawString(x, y, line)
        y -= leading
    return y


def draw_bullet_item(c, x, y, text, bullet_color=NAVY, font=None, size=9.5,
                     color=CHARCOAL, max_width=None, leading=None):
    """Draw a bullet point with wrapped text. Returns y after."""
    if font is None:
        font = F_BODY
    if max_width is None:
        max_width = CONTENT_W - 16
    if leading is None:
        leading = size * 1.55

    # Bullet dot
    c.setFillColor(bullet_color)
    c.circle(x + 4, y + 3, 2, fill=1, stroke=0)

    # Text
    text_x = x + 14
    y = draw_text_block(c, text_x, y, text, font=font, size=size,
                        color=color, max_width=max_width - 14, leading=leading)
    return y


# ---------------------------------------------------------------------------
# Page furniture: header and footer
# ---------------------------------------------------------------------------

def draw_header_bar(c):
    """Draw the navy header strip with logo and wordmark."""
    bar_h = 40
    bar_y = PAGE_H - bar_h

    # Navy bar
    c.setFillColor(NAVY)
    c.rect(0, bar_y, PAGE_W, bar_h, fill=1, stroke=0)

    # Ukraine blue accent line at very top
    c.setFillColor(UKRAINE_BLUE)
    c.rect(0, PAGE_H - 3, PAGE_W, 3, fill=1, stroke=0)

    # Logo
    logo_size = 22
    logo_y = bar_y + (bar_h - logo_size) / 2
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, MARGIN_L + 2, logo_y,
                    width=logo_size, height=logo_size,
                    preserveAspectRatio=True, mask='auto')

    # Wordmark
    c.setFont(F_HEAD, 14)
    c.setFillColor(CREAM)
    c.drawString(MARGIN_L + 30, bar_y + 12, "hromada")


def draw_footer(c, page_num, total_pages):
    """Draw footer with URL, email, and page number."""
    y = MARGIN_B - 18

    # Thin rule
    c.setStrokeColor(CREAM_DARK)
    c.setLineWidth(0.5)
    c.line(MARGIN_L, y + 12, PAGE_W - MARGIN_R, y + 12)

    c.setFont(F_BODY, 7)
    c.setFillColor(CHARCOAL_60)
    c.drawString(MARGIN_L, y, "hromadaproject.org")
    c.drawCentredString(PAGE_W / 2, y, "contact@hromadaproject.org")
    c.drawRightString(PAGE_W - MARGIN_R, y, f"{page_num} / {total_pages}")


# ---------------------------------------------------------------------------
# Section heading
# ---------------------------------------------------------------------------

def draw_section_heading(c, y, title, accent_color=UKRAINE_BLUE):
    """Draw a section heading with a small colored accent mark. Returns y below."""
    # Small accent square
    c.setFillColor(accent_color)
    c.rect(MARGIN_L, y + 1, 3, 14, fill=1, stroke=0)

    c.setFont(F_HEAD_SEMI, 14)
    c.setFillColor(NAVY)
    c.drawString(MARGIN_L + 12, y, title)
    return y - 22


def draw_sub_heading(c, y, title, color=NAVY):
    """Draw a smaller sub-heading. Returns y below."""
    c.setFont(F_HEAD_SEMI, 11)
    c.setFillColor(color)
    c.drawString(MARGIN_L, y, title)
    return y - 16


# ---------------------------------------------------------------------------
# Stat callout
# ---------------------------------------------------------------------------

def draw_stat_row(c, y, stats, value_color=UKRAINE_BLUE):
    """Draw a horizontal row of stat callouts. Returns y below."""
    n = len(stats)
    col_w = CONTENT_W / n
    for i, (value, label) in enumerate(stats):
        cx = MARGIN_L + i * col_w + col_w / 2
        c.setFont(F_HEAD_SEMI, 22)
        c.setFillColor(value_color)
        c.drawCentredString(cx, y, value)
        c.setFont(F_BODY, 8)
        c.setFillColor(CHARCOAL_60)
        c.drawCentredString(cx, y - 16, label)
    return y - 40


# ---------------------------------------------------------------------------
# Project card
# ---------------------------------------------------------------------------

def draw_project_card(c, x, y, name, location, cost, ptype, accent_color,
                      partner=None, width=None):
    """Draw a project card with accent stripe. Returns y below."""
    if width is None:
        width = CONTENT_W

    # Calculate card height
    line_count = 2 if partner is None else 3
    card_h = 14 + line_count * 14 + 8

    # Card background
    c.setFillColor(LIGHT_BG)
    c.roundRect(x, y - card_h, width, card_h, 3, fill=1, stroke=0)

    # Left accent stripe
    c.setFillColor(accent_color)
    c.rect(x, y - card_h, 3, card_h, fill=1, stroke=0)

    # Content
    text_x = x + 14
    text_y = y - 16

    c.setFont(F_BODY_SEMI, 10)
    c.setFillColor(NAVY)
    c.drawString(text_x, text_y, name)

    c.setFont(F_BODY, 8.5)
    c.setFillColor(CHARCOAL_60)
    c.drawString(text_x, text_y - 14, f"{location}  \u2022  {ptype}")

    if partner:
        c.drawString(text_x, text_y - 28, f"Partner: {partner}")

    # Cost — right-aligned
    c.setFont(F_HEAD_SEMI, 13)
    c.setFillColor(accent_color)
    c.drawRightString(x + width - 12, text_y - 2, cost)

    return y - card_h - 6


# ---------------------------------------------------------------------------
# Numbered step
# ---------------------------------------------------------------------------

def draw_numbered_step(c, y, num, title, desc, circle_color, desc_width=None):
    """Draw a numbered step with circle, title, and wrapped description."""
    if desc_width is None:
        desc_width = CONTENT_W - 38

    # Circle
    cx = MARGIN_L + 12
    cy = y + 4
    c.setFillColor(circle_color)
    c.circle(cx, cy, 11, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(F_HEAD_SEMI, 10)
    c.drawCentredString(cx, cy - 3.5, str(num))

    # Title
    text_x = MARGIN_L + 32
    c.setFont(F_BODY_SEMI, 10)
    c.setFillColor(NAVY)
    c.drawString(text_x, y + 2, title)

    # Description
    y_after = draw_text_block(c, text_x, y - 13, desc,
                              font=F_BODY, size=8.5, color=CHARCOAL_60,
                              max_width=desc_width, leading=13)
    return y_after - 6


# ---------------------------------------------------------------------------
# Logo helpers
# ---------------------------------------------------------------------------

def logo_width_for_height(name, target_h):
    """Calculate proportional width for a logo at a given height."""
    if name in LOGO_DIMS:
        w, h = LOGO_DIMS[name]
        return target_h * (w / h)
    return target_h  # fallback: square


def draw_logo_strip(c, y, logo_names, target_h=22, gap=20):
    """Draw a centered horizontal row of partner logos. Returns y below."""
    # Calculate total width
    widths = []
    paths = []
    for name in logo_names:
        path = PARTNER_LOGOS.get(name)
        if path and os.path.exists(path):
            w = logo_width_for_height(name, target_h)
            widths.append(w)
            paths.append((path, w))
        else:
            paths.append(None)
            widths.append(0)

    total_w = sum(w for w in widths if w > 0) + gap * (sum(1 for w in widths if w > 0) - 1)
    x = MARGIN_L + (CONTENT_W - total_w) / 2

    for i, entry in enumerate(paths):
        if entry is None:
            continue
        path, w = entry
        c.drawImage(path, x, y - target_h + 4, width=w, height=target_h,
                    preserveAspectRatio=True, mask='auto')
        x += w + gap

    return y - target_h - 10


def draw_sponsor_logos(c, y, logo_h=28):
    """Draw POCACITO logo + Candid seal side by side. Returns y below."""
    poc_w = logo_width_for_height("POCACITO", logo_h)
    candid_w = logo_width_for_height("Candid", logo_h)
    gap = 24
    total_w = poc_w + gap + candid_w
    x = MARGIN_L

    if os.path.exists(POCACITO_LOGO):
        c.drawImage(POCACITO_LOGO, x, y - logo_h + 2,
                    width=poc_w, height=logo_h,
                    preserveAspectRatio=True, mask='auto')
    if os.path.exists(CANDID_SEAL):
        c.drawImage(CANDID_SEAL, x + poc_w + gap, y - logo_h + 2,
                    width=candid_w, height=logo_h,
                    preserveAspectRatio=True, mask='auto')

    return y - logo_h - 8


def draw_partner_with_logo(c, x, y, name, desc, logo_h=20):
    """Draw a partner entry with inline logo, name, and wrapped description. Returns y below."""
    logo_path = PARTNER_LOGOS.get(name)
    logo_w = 0
    text_x = x

    if logo_path and os.path.exists(logo_path):
        logo_w = logo_width_for_height(name, logo_h)
        # Cap very wide logos
        max_logo_w = 1.2 * inch
        if logo_w > max_logo_w:
            scale = max_logo_w / logo_w
            logo_w = max_logo_w
            actual_h = logo_h * scale
        else:
            actual_h = logo_h

        c.drawImage(logo_path, x, y - actual_h + 6,
                    width=logo_w, height=actual_h,
                    preserveAspectRatio=True, mask='auto')
        text_x = x + logo_w + 10

    # Name
    c.setFont(F_BODY_SEMI, 9)
    c.setFillColor(NAVY)
    c.drawString(text_x, y, name)

    # Description — below name, indented to align with text
    desc_x = text_x
    desc_w = CONTENT_W - (desc_x - MARGIN_L)
    y_after = draw_text_block(c, desc_x, y - 13, desc,
                              font=F_BODY, size=8, color=CHARCOAL_60,
                              max_width=desc_w, leading=12)

    # Return whichever is lower — bottom of logo or bottom of text
    logo_bottom = y - logo_h - 2
    return min(y_after, logo_bottom) - 4


# ---------------------------------------------------------------------------
# Fee comparison table
# ---------------------------------------------------------------------------

def draw_fee_table(c, y, compact=False):
    """Draw the fee comparison table. Returns y below."""
    if compact:
        data = [
            ["Donation", "Hromada Fees", "% of Gift", "GlobalGiving"],
            ["$10,000", "$70\u201395", "0.7\u20131.0%", "$800\u20131,500 (8\u201315%)"],
            ["$25,000", "$70\u201395", "0.3\u20130.4%", "$2,000\u20133,750"],
            ["$50,000", "$70\u201395", "0.15\u20130.2%", "$4,000\u20137,500"],
            ["$100,000", "$70\u201395", "0.07\u20130.1%", "$8,000\u201315,000"],
        ]
        col_widths = [1.2 * inch, 1.05 * inch, 1.0 * inch, 1.6 * inch]
    else:
        data = [
            ["Donation Amount", "Hromada Fees", "As % of Gift", "GlobalGiving Equivalent"],
            ["$10,000", "$70\u201395", "0.7\u20131.0%", "$800\u20131,500 (8\u201315%)"],
            ["$25,000", "$70\u201395", "0.3\u20130.4%", "$2,000\u20133,750 (8\u201315%)"],
            ["$50,000", "$70\u201395", "0.15\u20130.2%", "$4,000\u20137,500 (8\u201315%)"],
            ["$100,000", "$70\u201395", "0.07\u20130.1%", "$8,000\u201315,000 (8\u201315%)"],
            ["$1,000,000", "$25\u201350*", "0.003\u20130.005%", "$80,000\u2013150,000 (8\u201315%)"],
        ]
        col_widths = [1.3 * inch, 1.2 * inch, 1.1 * inch, 1.8 * inch]

    table_w = sum(col_widths)
    table_x = MARGIN_L + (CONTENT_W - table_w) / 2

    t = Table(data, colWidths=col_widths)

    style_cmds = [
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), F_BODY_SEMI),
        ('FONTSIZE', (0, 0), (-1, 0), 8),

        # Body rows
        ('FONTNAME', (0, 1), (-1, -1), F_BODY),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), CHARCOAL),

        # Hromada columns — green
        ('TEXTCOLOR', (1, 1), (2, -1), GREEN),
        ('FONTNAME', (1, 1), (2, -1), F_BODY_SEMI),

        # GlobalGiving column — red/warm
        ('TEXTCOLOR', (3, 1), (3, -1), RED_SOFT),
        ('FONTNAME', (3, 1), (3, -1), F_BODY_SEMI),

        # Alternating row backgrounds
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),

        # No harsh grid — just subtle horizontal rules
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, NAVY),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, CREAM_DARK),
        ('LINEABOVE', (0, 1), (-1, 1), 0, WHITE),

        # Padding
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),

        # Alignment
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
    ]

    # Add subtle row dividers
    for row in range(1, len(data)):
        style_cmds.append(('LINEBELOW', (0, row), (-1, row), 0.25, CREAM_DARK))

    t.setStyle(TableStyle(style_cmds))
    w_t, h_t = t.wrap(table_w, 0)
    t.drawOn(c, table_x, y - h_t)

    return y - h_t - 4


# ===========================================================================
# Document 1: 2-Page Leave-Behind
# ===========================================================================

def generate_2pager(path):
    c = canvas.Canvas(path, pagesize=letter)
    c.setTitle("Hromada \u2014 Connecting US Donors with Ukraine\u2019s Municipal Energy Transition")
    c.setAuthor("Hromada | A Project of POCACITO Network")

    # --- PAGE 1 ---
    draw_header_bar(c)
    draw_footer(c, 1, 2)
    y = PAGE_H - MARGIN_T - 40  # below header bar

    # Pull quote
    y -= 8
    c.setFont(F_HEAD, 15)
    c.setFillColor(NAVY)
    quote = ("\u201cOur community knows what it needs to rebuild. "
             "We just need a way to reach the people who can help.\u201d")
    lines = wrap_text(c, quote, F_HEAD, 15, CONTENT_W - 12)
    for line in lines:
        c.drawString(MARGIN_L + 4, y, line)
        y -= 22
    y -= 2

    # Attribution
    c.setFont(F_BODY, 8)
    c.setFillColor(CHARCOAL_60)
    c.drawString(MARGIN_L + 4, y,
                 "\u2014 Framing inspired by Ukrainian municipal leaders partnering with Hromada")
    y -= 24

    # Subtle divider
    c.setStrokeColor(CREAM_DARK)
    c.setLineWidth(0.5)
    c.line(MARGIN_L, y, MARGIN_L + 3 * inch, y)
    y -= 22

    # --- What is Hromada ---
    y = draw_section_heading(c, y, "What is Hromada")
    y = draw_text_block(c, MARGIN_L, y,
        "Hromada (\u0433\u0440\u043e\u043c\u0430\u0434\u0430) means both \u201ccommunity\u201d and "
        "\u201cmunicipality\u201d in Ukrainian. Our platform connects Ukrainian municipalities "
        "directly with US donors for renewable energy projects \u2014 solar arrays, heat pumps, "
        "battery storage, and thermo-modernization for hospitals, schools, and essential "
        "services. Every project is requested by the community it serves, verified by "
        "on-the-ground NGO partners, and funded in full.",
        size=9.5, leading=15)
    y -= 12

    # --- Why This Matters ---
    y = draw_section_heading(c, y, "Why This Matters", accent_color=TERRACOTTA)
    y = draw_text_block(c, MARGIN_L, y,
        "Russia systematically targets Ukraine\u2019s centralized energy infrastructure to "
        "break civilian morale and create war fatigue. Rolling blackouts, freezing winters, "
        "and destroyed hospitals are a deliberate strategy. Traditional aid channels charge "
        "8\u201315% in platform fees and flow through national-level mechanisms too slowly "
        "for municipal needs.",
        size=9.5, leading=15)
    y -= 4
    y = draw_text_block(c, MARGIN_L, y,
        "A school with its own solar array cannot be shut down by bombing a central power "
        "station. Every decentralized renewable installation makes Russia\u2019s theory of "
        "victory harder to execute.",
        font=F_BODY_SEMI, size=9.5, color=NAVY, leading=15)
    y -= 16

    # --- Project Spotlight ---
    y = draw_section_heading(c, y, "Project Spotlight", accent_color=CAT_SCHOOL)
    y -= 2
    y = draw_project_card(c, MARGIN_L, y,
        "Children\u2019s Center \u201cRadist\u201d",
        "Novohrodivka, Donetsk Oblast", "$15,000",
        "30kW Solar PV", CAT_OTHER)
    y = draw_project_card(c, MARGIN_L, y,
        "Prylymanskyi Lyceum",
        "Odesa Oblast", "$18,000",
        "36kW Solar PV  \u2022  67 panels", CAT_SCHOOL)
    y = draw_project_card(c, MARGIN_L, y,
        "Lutskteplo District Heating",
        "Lutsk, Volyn Oblast", "$345,000",
        "210kW Heat Pump", CAT_ENERGY)
    y -= 6

    # Pipeline stats row
    y = draw_stat_row(c, y, [
        ("66", "projects"),
        ("$6.8M", "total pipeline"),
        ("44", "under $50K"),
        ("5", "NGO partners"),
    ])

    # --- PAGE 2 ---
    c.showPage()
    draw_header_bar(c)
    draw_footer(c, 2, 2)
    y = PAGE_H - MARGIN_T - 40

    # --- How It Works ---
    y -= 4
    y = draw_section_heading(c, y, "How It Works")
    y -= 2

    steps_2p = [
        ("#5B8FA8", "Community Request",
         "A Ukrainian municipality identifies a renewable energy need. Their NGO partner scopes the project and submits it to Hromada."),
        ("#7B9E6B", "Verification & Screening",
         "Hromada screens for OFAC sanctions compliance, checks transparency data, and verifies the project with the NGO partner."),
        ("#D4954A", "Published on Platform",
         "The verified project goes live with full details: municipality, oblast, cost breakdown, and NGO partner attribution."),
        ("#C75B39", "Donor Funds the Project",
         "You browse projects, choose one, and send funds via wire transfer or DAF to POCACITO Network, our 501(c)(3) fiscal sponsor."),
        ("#3D7A4A", "Funds Reach the Municipality",
         "After a second sanctions screen, funds transfer directly to the Ukrainian municipal bank account via SWIFT wire."),
    ]

    for i, (color, title, desc) in enumerate(steps_2p):
        y = draw_numbered_step(c, y, i + 1, title, desc, HexColor(color))

    y -= 6

    # --- Fee Comparison ---
    y = draw_section_heading(c, y, "Fee Comparison", accent_color=GREEN)
    c.setFont(F_BODY_SEMI, 9)
    c.setFillColor(NAVY)
    c.drawString(MARGIN_L, y + 2,
                 "The only fee is your bank\u2019s standard wire transfer fee \u2014 typically $25\u201350. Hromada takes nothing.")
    y -= 14
    y = draw_fee_table(c, y, compact=True)
    y -= 8

    # --- Team ---
    y = draw_section_heading(c, y, "Our Team", accent_color=NAVY)
    team = [
        ("Thomas Protzman",
         "Founder & Project Director  \u2022  MIA, Hertie School Berlin"),
        ("Kostiantyn Krynytskyi",
         "Co-Founder & Director \u2014 Ukraine  \u2022  Head of Energy, NGO Ecoaction"),
        ("Sloan Austermann",
         "Co-Founder & Alternate Director  \u2022  AI Engineer, Accenture Federal Services"),
    ]
    for name, role in team:
        c.setFont(F_BODY_SEMI, 9)
        c.setFillColor(NAVY)
        c.drawString(MARGIN_L, y, name)
        name_w = c.stringWidth(name + "  ", F_BODY_SEMI, 9)
        c.setFont(F_BODY, 8)
        c.setFillColor(CHARCOAL_60)
        c.drawString(MARGIN_L + name_w, y, role)
        y -= 15

    y -= 2

    # Fiscal sponsor line + logos
    c.setFont(F_BODY, 8)
    c.setFillColor(CHARCOAL_60)
    c.drawString(MARGIN_L, y,
                 "Fiscal sponsor: POCACITO Network, 501(c)(3)  \u2022  "
                 "EIN 99-0392258  \u2022  Candid Platinum Seal of Transparency")
    y -= 12
    y = draw_sponsor_logos(c, y, logo_h=26)

    # --- CTA Block ---
    cta_h = 46
    cta_y = max(y - cta_h, MARGIN_B + 24)
    c.setFillColor(NAVY)
    c.roundRect(MARGIN_L, cta_y, CONTENT_W, cta_h, 4, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont(F_HEAD_SEMI, 12)
    c.drawCentredString(PAGE_W / 2, cta_y + cta_h - 18,
                        "Browse projects at hromadaproject.org")
    c.setFont(F_BODY, 9)
    c.setFillColor(HexColor("#C8D6E5"))
    c.drawCentredString(PAGE_W / 2, cta_y + 10,
                        "Book a consultation: contact@hromadaproject.org")

    c.save()
    print(f"  \u2713 {path}")


# ===========================================================================
# Document 2: 6-Page Deep-Dive
# ===========================================================================

def generate_6pager(path):
    c = canvas.Canvas(path, pagesize=letter)
    c.setTitle("Hromada: Connecting US Donors with Ukraine\u2019s Municipal Energy Transition")
    c.setAuthor("Hromada | A Project of POCACITO Network")

    # -------------------------------------------------------------------
    # PAGE 1 — Cover
    # -------------------------------------------------------------------
    # Full navy background
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Thin blue accent at top
    c.setFillColor(UKRAINE_BLUE)
    c.rect(0, PAGE_H - 4, PAGE_W, 4, fill=1, stroke=0)

    # Logo centered
    logo_size = 56
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH,
                    (PAGE_W - logo_size) / 2, PAGE_H - 170,
                    width=logo_size, height=logo_size,
                    preserveAspectRatio=True, mask='auto')

    # Wordmark
    c.setFont(F_HEAD, 36)
    c.setFillColor(CREAM)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 210, "hromada")

    # Ukrainian subtitle
    c.setFont(F_BODY, 10)
    c.setFillColor(HexColor("#8FA4BD"))
    c.drawCentredString(PAGE_W / 2, PAGE_H - 230,
                        "\u0433\u0440\u043e\u043c\u0430\u0434\u0430  \u2014  community  \u2022  municipality")

    # Divider line
    div_w = 80
    c.setStrokeColor(UKRAINE_BLUE)
    c.setLineWidth(1.5)
    c.line((PAGE_W - div_w) / 2, PAGE_H - 260,
           (PAGE_W + div_w) / 2, PAGE_H - 260)

    # Title
    c.setFont(F_HEAD_SEMI, 18)
    c.setFillColor(WHITE)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 300,
                        "Connecting US Donors with Ukraine\u2019s")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 324,
                        "Municipal Energy Transition")

    # Key stats row
    cover_stats = [
        ("66", "Projects"),
        ("$6.8M", "Pipeline"),
        ("5", "NGO Partners"),
        ("44", "Under $50K"),
    ]
    stat_y = PAGE_H - 400
    col_w = CONTENT_W / 4
    for i, (val, label) in enumerate(cover_stats):
        sx = MARGIN_L + i * col_w + col_w / 2
        c.setFont(F_HEAD_SEMI, 26)
        c.setFillColor(GOLD)
        c.drawCentredString(sx, stat_y, val)
        c.setFont(F_BODY, 8.5)
        c.setFillColor(HexColor("#8FA4BD"))
        c.drawCentredString(sx, stat_y - 20, label)

    # Bottom info
    c.setFont(F_BODY, 8.5)
    c.setFillColor(HexColor("#6B8DB5"))
    c.drawCentredString(PAGE_W / 2, 100,
                        "A Project of POCACITO Network  \u2022  501(c)(3)  \u2022  EIN 99-0392258")
    c.drawCentredString(PAGE_W / 2, 84,
                        "hromadaproject.org  \u2022  contact@hromadaproject.org")
    c.setFont(F_BODY, 8)
    c.setFillColor(HexColor("#4F7DA8"))
    c.drawCentredString(PAGE_W / 2, 62, "February 2026")

    # -------------------------------------------------------------------
    # PAGE 2 — The Problem & Strategic Argument
    # -------------------------------------------------------------------
    c.showPage()
    draw_header_bar(c)
    draw_footer(c, 2, 6)
    y = PAGE_H - MARGIN_T - 40

    y = draw_section_heading(c, y, "The Problem", accent_color=TERRACOTTA)
    y = draw_text_block(c, MARGIN_L, y,
        "Russia\u2019s strategy in this war is not only military \u2014 it is societal. "
        "By systematically targeting Ukraine\u2019s centralized energy infrastructure, "
        "Russia aims to break civilian morale and create war fatigue. Rolling blackouts, "
        "freezing winters, and shuttered hospitals and schools are a deliberate tactic "
        "to wear down Ukrainian society\u2019s will to defend itself.",
        size=10, leading=16)
    y -= 10

    y = draw_text_block(c, MARGIN_L, y,
        "Traditional international donor channels are not built for this problem:",
        font=F_BODY_SEMI, size=10, color=NAVY, leading=16)
    y -= 2

    problems = [
        "Most aid flows through centralized national-level mechanisms, not to individual municipalities.",
        "Ukrainian communities know exactly what they need, but have no direct channel to reach international donors.",
        "Platforms like GlobalGiving charge 8\u201315% in fees before money reaches anyone.",
        "Large institutional aid programs are slow, bureaucratic, and often not designed for renewable energy infrastructure.",
    ]
    for p in problems:
        y = draw_bullet_item(c, MARGIN_L, y, p, bullet_color=TERRACOTTA,
                            size=9.5, leading=14.5)
        y -= 2
    y -= 12

    # Strategic argument
    y = draw_section_heading(c, y, "The Strategic Argument", accent_color=UKRAINE_BLUE)

    # Pull quote box
    box_h = 54
    c.setFillColor(HexColor("#EDF1F7"))
    c.roundRect(MARGIN_L, y - box_h, CONTENT_W, box_h, 3, fill=1, stroke=0)
    c.setFillColor(UKRAINE_BLUE)
    c.rect(MARGIN_L, y - box_h, 3, box_h, fill=1, stroke=0)

    quote_text = ("A school with its own solar array cannot be shut down by bombing a "
                  "central power station. Every decentralized renewable installation makes "
                  "Russia\u2019s theory of victory harder to execute.")
    draw_text_block(c, MARGIN_L + 16, y - 14, quote_text,
                    font=F_BODY_SEMI, size=10.5, color=NAVY,
                    max_width=CONTENT_W - 28, leading=16)
    y -= box_h + 14

    y = draw_text_block(c, MARGIN_L, y,
        "This is not charity. It is resilience infrastructure. Each solar array on a "
        "hospital, each heat pump in a school, each battery system for a water utility "
        "represents a permanent reduction in Ukraine\u2019s vulnerability to centralized "
        "infrastructure attacks. What is decentralized cannot be destroyed in a single strike.",
        size=9.5, leading=15)
    y -= 4
    y = draw_text_block(c, MARGIN_L, y,
        "Hromada exclusively supports civilian infrastructure \u2014 hospitals, schools, "
        "water utilities, and community energy systems. No military equipment. "
        "No dual-use technology. Ever.",
        font=F_BODY_SEMI, size=9.5, color=NAVY, leading=15)
    y -= 16

    # The Solution
    y = draw_section_heading(c, y, "The Solution", accent_color=GREEN)
    y = draw_text_block(c, MARGIN_L, y,
        "Hromada is a verified, transparent platform that connects Ukrainian municipalities "
        "directly with US donors for renewable energy projects. Every project is requested "
        "by the community it serves, scoped and verified by an on-the-ground NGO partner, "
        "screened for sanctions compliance, and funded in full through tax-deductible "
        "donations to our 501(c)(3) fiscal sponsor, POCACITO Network.",
        size=9.5, leading=15)
    y -= 4
    y = draw_text_block(c, MARGIN_L, y,
        "Project categories include solar PV installations, battery storage systems, "
        "heat pumps, and thermo-modernization across hospitals, schools, water utilities, "
        "and essential municipal infrastructure.",
        size=9.5, leading=15)

    # -------------------------------------------------------------------
    # PAGE 3 — How the Platform Works
    # -------------------------------------------------------------------
    c.showPage()
    draw_header_bar(c)
    draw_footer(c, 3, 6)
    y = PAGE_H - MARGIN_T - 40

    y = draw_section_heading(c, y, "How the Platform Works")
    y -= 4

    full_steps = [
        ("#5B8FA8", "Community Request",
         "A Ukrainian municipality identifies a renewable energy need. Their on-the-ground "
         "NGO partner scopes the project, produces a cost estimate, and submits it to "
         "Hromada on behalf of the community."),
        ("#7B9E6B", "Pre-Screening & Due Diligence",
         "Before publication, Hromada conducts sanctions screening of all individuals "
         "associated with the municipality, verifies transparency data, and confirms the "
         "project is in territory under effective Ukrainian government control."),
        ("#8B7355", "Published on Platform",
         "The verified project appears on Hromada\u2019s interactive platform with full "
         "details: municipality name, oblast, project type, cost breakdown, NGO partner, "
         "and co-financing status."),
        ("#D4954A", "Donor Discovery & Consultation",
         "A donor browses the platform, finds a project, and books a brief consultation "
         "with the Hromada team to discuss the project and answer questions."),
        ("#C75B39", "Donation",
         "The donor sends funds via wire transfer or DAF directly to POCACITO Network\u2019s "
         "Bank of America account. Hromada accepts only donations that fund one or more "
         "complete projects \u2014 no partial funding."),
        ("#5B8FA8", "Second-Round Due Diligence",
         "When funds arrive at POCACITO, Hromada conducts a second round of sanctions "
         "checks before any disbursement."),
        ("#7B9E6B", "Legal Framework",
         "NGO partners sign MoUs defining verification and monitoring obligations. "
         "Municipalities sign contracts committing to intended use \u2014 with legal "
         "recourse. All procurement goes through Prozorro, Ukraine\u2019s public platform."),
        ("#D4954A", "Disbursement",
         "Funds transfer from POCACITO\u2019s Bank of America account to the Ukrainian "
         "municipality via international SWIFT wire in USD. Direct bank-to-bank, "
         "no third-party transfer service."),
        ("#3D7A4A", "Donor Dashboard & Updates",
         "Donors receive a tax-deductible receipt, secure login, and a dashboard to track "
         "their donation. Project updates with photos and receipts come from the NGO "
         "partner. Procurement is visible via Prozorro."),
    ]

    for i, (color, title, desc) in enumerate(full_steps):
        y = draw_numbered_step(c, y, i + 1, title, desc, HexColor(color))

    # -------------------------------------------------------------------
    # PAGE 4 — Transparency & Accountability
    # -------------------------------------------------------------------
    c.showPage()
    draw_header_bar(c)
    draw_footer(c, 4, 6)
    y = PAGE_H - MARGIN_T - 40

    y = draw_section_heading(c, y, "Transparency & Accountability")
    y = draw_text_block(c, MARGIN_L, y,
        "Hromada is built on the principle that donor trust comes from evidence, not "
        "claims. Every step \u2014 from project submission to fund disbursement \u2014 "
        "includes verifiable accountability mechanisms.",
        size=9.5, leading=15)
    y -= 14

    acct_sections = [
        ("Pre-Publication Screening", UKRAINE_BLUE, [
            "OFAC sanctions screening of all municipality officials and associated individuals",
            "Transparency score verification via TI Ukraine\u2019s Transparent Cities ranking",
            "Confirmation of territory under effective Ukrainian government control",
            "Verification of intended civilian use of funds",
        ]),
        ("Procurement Transparency", CAT_ENERGY, [
            "All procurement goes through Prozorro, Ukraine\u2019s public electronic procurement platform",
            "Contractor selection is fully transparent and auditable by any party",
            "No sanctioned entities may participate in the procurement process",
        ]),
        ("NGO Partner Obligations", CAT_SCHOOL, [
            "Partners verify municipality legitimacy, official identity, and project scope accuracy",
            "Partners monitor fund use and report any misuse immediately",
            "Monthly progress reports with photos; structured completion report within 30 days",
            "Anti-corruption and anti-diversion commitments with indemnification for breaches",
            "Municipalities sign contracts committing to intended use \u2014 with legal recourse",
        ]),
        ("Donor Accountability", TERRACOTTA, [
            "Tax-deductible receipt from POCACITO Network (501(c)(3), EIN 99-0392258)",
            "Secure donor dashboard with donation tracking and status timeline",
            "Progress photos and completion documentation from NGO partners",
            "Full visibility into procurement via Prozorro links",
        ]),
        ("Fiscal Sponsor Oversight", NAVY_80, [
            "POCACITO Network reviews and approves all disbursements",
            "Authority to suspend any disbursement pending compliance review",
            "Candid Platinum Seal of Transparency \u2014 highest level of nonprofit accountability",
            "Second-round sanctions screening before every international transfer",
        ]),
    ]

    for title, color, bullets in acct_sections:
        # Section sub-heading with colored underline
        c.setFont(F_BODY_SEMI, 10.5)
        c.setFillColor(NAVY)
        c.drawString(MARGIN_L, y, title)
        y -= 4
        c.setFillColor(color)
        c.rect(MARGIN_L, y, c.stringWidth(title, F_BODY_SEMI, 10.5), 1.5,
               fill=1, stroke=0)
        y -= 14

        for bullet in bullets:
            y = draw_bullet_item(c, MARGIN_L, y, bullet, bullet_color=color,
                                size=8.5, leading=13, max_width=CONTENT_W - 16)
            y -= 1
        y -= 10

    # -------------------------------------------------------------------
    # PAGE 5 — The Project Pipeline
    # -------------------------------------------------------------------
    c.showPage()
    draw_header_bar(c)
    draw_footer(c, 5, 6)
    y = PAGE_H - MARGIN_T - 40

    y = draw_section_heading(c, y, "The Project Pipeline")
    y -= 2

    y = draw_stat_row(c, y, [
        ("66", "total projects"),
        ("$6.8M", "funding needed"),
        ("$7.5K\u2013$3M", "project range"),
        ("44 of 66", "under $50K"),
    ])
    y -= 4

    # Categories
    y = draw_sub_heading(c, y, "Project Categories")
    cats = [
        ("Hospital / Medical", CAT_HOSPITAL),
        ("School / Education", CAT_SCHOOL),
        ("Water Utility", CAT_WATER),
        ("Energy", CAT_ENERGY),
        ("Other", CAT_OTHER),
    ]
    cx = MARGIN_L
    for label, color in cats:
        c.setFillColor(color)
        c.circle(cx + 5, y + 3, 4, fill=1, stroke=0)
        c.setFont(F_BODY, 8.5)
        c.setFillColor(CHARCOAL)
        c.drawString(cx + 14, y, label)
        cx += c.stringWidth(label, F_BODY, 8.5) + 30
    y -= 22

    # Selected projects
    y = draw_sub_heading(c, y, "Selected Projects")

    projects = [
        ("Children\u2019s Center \u201cRadist\u201d",
         "Novohrodivka, Donetsk Oblast", "$15,000",
         "30kW Solar PV  \u2022  56 panels", CAT_OTHER, "NGO Ecoaction"),
        ("Prylymanskyi Lyceum",
         "Avanhardivska, Odesa Oblast", "$18,000",
         "36kW Solar PV  \u2022  67 panels", CAT_SCHOOL, "Energy Act For Ukraine"),
        ("Maternity Hospital",
         "Nizhyn, Chernihiv Oblast", "$60,000",
         "Solar PV Installation", CAT_HOSPITAL, "NGO Partner TBD"),
        ("Lutskteplo District Heating",
         "Lutsk, Volyn Oblast", "$345,000",
         "210kW Heat Pump", CAT_ENERGY, "NGO Ecoclub"),
        ("School #7",
         "Novohrodivka, Donetsk Oblast", "$45,000",
         "90kW Solar PV  \u2022  167 panels", CAT_SCHOOL, "NGO Ecoaction"),
    ]

    for name, loc, cost, ptype, color, partner in projects:
        y = draw_project_card(c, MARGIN_L, y, name, loc, cost, ptype, color,
                             partner=partner)

    y -= 4

    # NGO Partners — logo strip then text descriptions
    y = draw_sub_heading(c, y, "NGO Partners")

    # Centered logo strip
    y = draw_logo_strip(c, y, ["Ecoaction", "Ecoclub", "RePower Ukraine",
                                "Greenpeace CEE", "Energy Act For Ukraine"],
                        target_h=20, gap=16)
    y -= 2

    partners = [
        ("Ecoaction",
         "Ukraine\u2019s leading environmental NGO. Leads just-transition work for "
         "coal communities. Head of Energy: Kostiantyn Krynytskyi."),
        ("Ecoclub",
         "Rivne-based environmental organization focused on energy efficiency and "
         "renewable energy in western Ukraine."),
        ("RePower Ukraine",
         "Coalition supporting Ukraine\u2019s decentralized energy transition and "
         "post-war reconstruction."),
        ("Greenpeace CEE",
         "Central and Eastern Europe division. Supports community-scale renewable "
         "projects in conflict-affected areas."),
        ("Energy Act For Ukraine",
         "Connects international expertise with Ukrainian communities for energy "
         "infrastructure recovery."),
    ]

    for name, desc in partners:
        c.setFont(F_BODY_SEMI, 8.5)
        c.setFillColor(NAVY)
        c.drawString(MARGIN_L, y, name)
        name_w = c.stringWidth(name, F_BODY_SEMI, 8.5)
        c.setFont(F_BODY, 8)
        c.setFillColor(CHARCOAL_60)
        remaining_w = CONTENT_W - name_w - 12
        if c.stringWidth(desc, F_BODY, 8) > remaining_w:
            lines = wrap_text(c, desc, F_BODY, 8, CONTENT_W - 12)
            c.drawString(MARGIN_L + name_w + 8, y, lines[0] if lines else "")
            for j, line in enumerate(lines[1:3], 1):
                c.drawString(MARGIN_L + 12, y - (j * 12), line)
            y -= 12 * min(len(lines), 3) + 4
        else:
            c.drawString(MARGIN_L + name_w + 8, y, desc)
            y -= 14

    # -------------------------------------------------------------------
    # PAGE 6 — Team, Fiscal Sponsor, Fees & CTA
    # -------------------------------------------------------------------
    c.showPage()
    draw_header_bar(c)
    draw_footer(c, 6, 6)
    y = PAGE_H - MARGIN_T - 40

    y = draw_section_heading(c, y, "Our Team")

    team_bios = [
        ("Thomas Protzman", "Founder & Project Director",
         "Thomas built Hromada to channel US philanthropic capital toward Ukraine\u2019s "
         "municipal renewable energy transition. He holds a Master of International Affairs "
         "from the Hertie School in Berlin and writes on climate change, transatlantic "
         "affairs, and European politics."),
        ("Kostiantyn Krynytskyi", "Co-Founder & Director \u2014 Ukraine",
         "Kostiantyn is Head of the Energy Department at NGO Ecoaction, where he leads "
         "work on just transition for coal-dependent communities in Eastern Ukraine. "
         "A lawyer by training, he has served as an analyst for Ukraine\u2019s Public "
         "Integrity Council and as legal counsel for CrimeaSOS."),
        ("Sloan Austermann", "Co-Founder & Alternate Project Director",
         "Sloan is an AI Engineer at Accenture Federal Services, designing and deploying "
         "cloud-native systems supporting critical federal operations. He holds multiple "
         "AWS certifications and dual degrees in International Economics and Mathematics "
         "from the University of Notre Dame."),
    ]

    for name, role, bio in team_bios:
        c.setFont(F_BODY_SEMI, 10.5)
        c.setFillColor(NAVY)
        c.drawString(MARGIN_L, y, name)
        c.setFont(F_BODY, 8.5)
        c.setFillColor(UKRAINE_BLUE)
        c.drawString(MARGIN_L, y - 14, role)
        y = draw_text_block(c, MARGIN_L, y - 28, bio,
                           size=8.5, leading=13, color=CHARCOAL)
        y -= 10

    y -= 4

    # Fiscal Sponsor — with logos
    y = draw_section_heading(c, y, "Fiscal Sponsor", accent_color=GOLD)
    y = draw_text_block(c, MARGIN_L, y,
        "POCACITO Network is a US 501(c)(3) nonprofit that serves as Hromada\u2019s fiscal "
        "sponsor. All donations are received by POCACITO and are tax-deductible. POCACITO "
        "holds a Candid Platinum Seal of Transparency \u2014 the highest level of nonprofit "
        "accountability on GuideStar.",
        size=9, leading=14)
    y -= 6

    # POCACITO logo + Candid seal — side by side, left-aligned
    y = draw_sponsor_logos(c, y, logo_h=32)

    c.setFont(F_BODY, 8)
    c.setFillColor(CHARCOAL_60)
    c.drawString(MARGIN_L, y,
                 "EIN 99-0392258  \u2022  Candid: app.candid.org/profile/16026326/pocacito-network/")
    y -= 16

    # Fee table — use compact version to avoid CTA collision
    y = draw_section_heading(c, y, "Fee Structure", accent_color=GREEN)
    c.setFont(F_BODY_SEMI, 9)
    c.setFillColor(NAVY)
    c.drawString(MARGIN_L, y + 2,
                 "Zero platform fees. You only pay your bank\u2019s wire transfer fee ($25\u201350).")
    y -= 14
    y = draw_fee_table(c, y, compact=True)

    # CTA block
    cta_h = 48
    cta_y = max(MARGIN_B + 26, y - cta_h - 8) if y > MARGIN_B + 80 else MARGIN_B + 26
    c.setFillColor(NAVY)
    c.roundRect(MARGIN_L, cta_y, CONTENT_W, cta_h, 4, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont(F_HEAD_SEMI, 13)
    c.drawCentredString(PAGE_W / 2, cta_y + cta_h - 20,
                        "Fund a project  \u2022  Become an NGO partner")
    c.setFont(F_BODY, 9)
    c.setFillColor(HexColor("#C8D6E5"))
    c.drawCentredString(PAGE_W / 2, cta_y + 10,
                        "hromadaproject.org  |  contact@hromadaproject.org")

    c.save()
    print(f"  \u2713 {path}")


# ===========================================================================
# Main
# ===========================================================================

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    fonts_ok = setup_fonts()
    if not fonts_ok:
        global F_HEAD, F_HEAD_SEMI, F_HEAD_REG, F_BODY, F_BODY_SEMI, F_BODY_BOLD
        F_HEAD = "Helvetica-Bold"
        F_HEAD_SEMI = "Helvetica-Bold"
        F_HEAD_REG = "Helvetica"
        F_BODY = "Helvetica"
        F_BODY_SEMI = "Helvetica-Bold"
        F_BODY_BOLD = "Helvetica-Bold"
        print("  Using Helvetica fallback fonts")

    print("Generating Hromada PDFs...")
    generate_2pager(os.path.join(OUTPUT_DIR, "hromada_2pager.pdf"))
    generate_6pager(os.path.join(OUTPUT_DIR, "hromada_6pager.pdf"))
    print(f"\nDone. Files in: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
