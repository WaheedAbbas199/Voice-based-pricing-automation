"""Default content, settings and the AI prompt. Everything here can be changed later from the CMS."""

DEFAULT_PROMPT = """You are the extraction engine of a pricing platform. You will hear a short audio message in which a person describes a product, order or pricing request.

1. Transcribe the speech faithfully in the language that is spoken. Do not translate and do not invent words.
2. Extract the fields listed below. If something was not said, use "" (or 0 for numbers) and give it confidence 0. Never guess.
3. For "product", choose the closest match from this catalog and return its EXACT name. If nothing matches, return the product as spoken. Catalog: {catalog}

Return ONLY valid JSON (no markdown, no commentary) with exactly this shape:
{"transcript": "", "extracted": {"product": "", "category": "", "quantity": 0, "unit": "", "location": "", "customer": "", "requirements": "", "delivery": "", "notes": "", "discount": 0}, "confidence": {"product": 0, "category": 0, "quantity": 0, "unit": 0, "location": 0, "customer": 0, "requirements": 0, "delivery": 0, "notes": 0}}

"quantity" is a number. "discount" is a percentage number (0 when none was mentioned). Confidence values are between 0 and 1."""

SYSCONFIG = {"maxAudioMB": 15, "maxSeconds": 300, "allowSignups": True, "maintenance": False, "autoDeleteDays": 30, "maxDiscount": 25}
THEME = {"primary": "#635BFF", "secondary": "#8B5CF6", "accent": "#06B6D4", "radius": 16, "buttonRadius": 12,
         "fontDisplay": "Sora", "fontBody": "Manrope"}
FLAGS = {k: True for k in ("showFeatures", "showHow", "showBenefits", "showPricing", "showTestimonials", "showFaq",
                           "showCta", "allowSignups", "enableRecording", "enableUpload")}
SITE = {}   # empty = the landing page keeps its built-in texts until you edit them in the CMS

PRODUCTS = [("Portland Cement 50kg", "Construction", "bag", 9.5), ("Steel Rebar 12mm", "Construction", "ton", 720),
            ("Red Clay Bricks", "Construction", "1000 pcs", 210), ("Industrial LED Panel 60W", "Electrical", "piece", 38),
            ("Solar Panel 550W", "Energy", "piece", 185), ("Office Chair Ergonomic", "Furniture", "piece", 145),
            ("A4 Copy Paper", "Stationery", "ream", 5.2), ("Cooking Oil 5L", "Food", "carton", 31),
            ("Cotton Fabric Roll", "Textile", "roll", 64), ('Business Laptop 15"', "Electronics", "piece", 820)]

CMS = {
    "features": [("mic", "Record or upload", "Capture a spoken order in the browser, or drop in an existing audio file. A live waveform shows the microphone is working."),
                 ("sparkle", "Pulls out the details", "Product, quantity, unit, location, customer and delivery needs are separated into fields, each with a confidence score."),
                 ("edit", "Edit before pricing", "Nothing is priced until you have checked the extracted details. Correct any field, then calculate."),
                 ("calc", "Clear price breakdown", "Subtotal, discount, tax, delivery and final total are shown line by line and update as you type."),
                 ("file", "Quotations and customers", "Turn a calculation into a quotation, track its status from draft to approved, and keep every customer's history together."),
                 ("chart", "Analytics that matter", "See revenue, most requested products, customer activity and how many audio requests were processed or failed.")],
    "steps": [("Record or upload", "Speak the order or add an audio file."), ("Review the transcript", "Read what was heard and spot mistakes early."),
              ("Confirm the details", "Edit product, quantity, unit and delivery notes."), ("Send the quote", "Save the price, create a quotation and share it.")],
    "benefits": [("clock", "Quote while the customer is still on the line", "Dictate the order instead of typing it into a spreadsheet."),
                 ("shield", "Fewer pricing mistakes", "One calculation engine and a visible breakdown for every quote."),
                 ("users", "One place for the whole customer story", "Calculations, quotations and contacts are linked.")],
    "stats": [("1", "tap to start recording"), ("14", "screens included"), ("7", "visible processing stages"), ("2", "themes, fully styled")],
    "plans": [("Starter", 29, 23, "500 audio minutes\n3 seats\nEmail support", False), ("Growth", 99, 79, "3,000 audio minutes\n15 seats\nQuotation PDFs\nPriority support", True),
              ("Scale", 299, 239, "15,000 audio minutes\nUnlimited seats\nAdmin console and audit log\nSSO", False)],
    "testimonials": [("Pricing used to wait until someone was back at a desk. Now the draft quote exists before the call ends.", "Nadia R.", "Sales lead, building supplies"),
                     ("The edit-before-pricing step is what made our team trust it. It never prices a guess.", "Imran S.", "Operations manager, distribution"),
                     ("Customer history and quotations in one place saved us a lot of tab switching.", "Laila M.", "Founder, office furniture")],
    "faqs": [("Is the AI real in this version?", "Yes when the backend is running with a Gemini API key: audio is transcribed and the details are extracted by Google Gemini. Without the backend, the frontend runs in demo mode with clearly labelled sample data."),
             ("Which browsers can record audio?", "Current Chrome, Edge, Firefox and Safari. Recording needs HTTPS or localhost; in any other case you can still upload a file."),
             ("Can I change what the system extracted?", "Yes. Every extracted field is editable and nothing is priced until you confirm."),
             ("Does it work on a phone?", "Yes. The recorder, tables and navigation are built for touch screens and small displays."),
             ("Where is my data stored?", "In the PostgreSQL database that your backend is connected to.")],
}
FIELDS = {
    "features": ("icon", "title", "text"), "steps": ("title", "text"), "benefits": ("icon", "title", "text"), "stats": ("value", "label"),
    "plans": ("name", "monthly", "yearly", "features", "featured"), "testimonials": ("quote", "name", "role"), "faqs": ("question", "answer")}


def cms_rows():
    for coll, rows in CMS.items():
        for i, r in enumerate(rows):
            yield coll, i, dict(zip(FIELDS[coll], r))
