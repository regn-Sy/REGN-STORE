/* REGN STORE V3
   Product actions + Syrian governorate/location selector.
   Location source: OpenSyria public geography API.
*/

"use strict";

const STORAGE = {
    balance: "regnBalance",
    account: "regnAccount",
    favorites: "regnFavorites",
    cart: "regnCart",
    purchases: "regnPurchases",
    transactions: "regnTransactions",
    feedback: "regnFeedback",
    ratings: "regnRatings"
};

const API_BASE = "https://api.opensyria.org/api/v1/geography";

const FALLBACK_GOVERNORATES = [
    { id: 1, name: "دمشق" },
    { id: 2, name: "ريف دمشق" },
    { id: 3, name: "القنيطرة" },
    { id: 4, name: "درعا" },
    { id: 5, name: "السويداء" },
    { id: 6, name: "حمص" },
    { id: 7, name: "طرطوس" },
    { id: 8, name: "اللاذقية" },
    { id: 9, name: "حماة" },
    { id: 10, name: "إدلب" },
    { id: 11, name: "حلب" },
    { id: 12, name: "الرقة" },
    { id: 13, name: "دير الزور" },
    { id: 14, name: "الحسكة" }
];

const PRODUCTS = [
    {
        id: "iphone12",
        name: "iPhone 12",
        price: 299,
        category: "phones",
        categoryName: "📱 هواتف",
        icon: "📱",
        description: "هاتف Apple عملي ومناسب للاستخدام اليومي.",
        popularity: 92,
        specs: [
            "الشاشة: 6.1 بوصة",
            "المعالج: A14 Bionic",
            "التخزين: 128GB",
            "صحة البطارية: 71%",
            "الكاميرا: 12MP",
            "الشبكة: 4G / 5G",
            "Face ID",
            "مقاومة الماء IP68"
        ]
    },
    {
        id: "regn-laptop",
        name: "REGN Laptop",
        price: 499,
        category: "laptops",
        categoryName: "💻 لابتوبات",
        icon: "💻",
        description: "لابتوب للاستخدام اليومي والبرمجة والمشاريع.",
        popularity: 87,
        specs: [
            "الشاشة: 15.6 بوصة",
            "المعالج: Intel Core i5",
            "الذاكرة: 8GB RAM",
            "التخزين: 256GB SSD",
            "النظام: Windows",
            "Wi-Fi + Bluetooth"
        ]
    },
    {
        id: "wireless-headphones",
        name: "Wireless Headphones",
        price: 59,
        category: "audio",
        categoryName: "🎧 صوتيات",
        icon: "🎧",
        description: "سماعات لاسلكية للاستخدام اليومي والألعاب.",
        popularity: 81,
        specs: [
            "اتصال: Bluetooth",
            "بطارية: حتى 30 ساعة",
            "ميكروفون مدمج",
            "شحن USB-C",
            "وضع منخفض التأخير"
        ]
    },
    {
        id: "gaming-controller",
        name: "REGN Gaming Controller",
        price: 39,
        category: "gaming",
        categoryName: "🎮 ألعاب",
        icon: "🎮",
        description: "يد تحكم لاسلكية للألعاب المتوافقة.",
        popularity: 76,
        specs: [
            "اتصال: Bluetooth",
            "اهتزاز",
            "بطارية قابلة للشحن",
            "USB-C",
            "متوافق مع أجهزة متعددة"
        ]
    },
    {
        id: "fast-charger",
        name: "REGN Fast Charger",
        price: 25,
        category: "accessories",
        categoryName: "🔌 إكسسوارات",
        icon: "🔌",
        description: "شاحن سريع للاستخدام اليومي.",
        popularity: 70,
        specs: [
            "قدرة: 25W",
            "منفذ: USB-C",
            "حماية من الحرارة",
            "حماية من زيادة التيار"
        ]
    }
];

let state = {
    balance: Number(localStorage.getItem(STORAGE.balance)),
    account: readJSON(STORAGE.account, { username: "", email: "" }),
    favorites: readJSON(STORAGE.favorites, []),
    cart: readJSON(STORAGE.cart, []),
    purchases: readJSON(STORAGE.purchases, []),
    transactions: readJSON(STORAGE.transactions, []),
    feedback: readJSON(STORAGE.feedback, []),
    ratings: readJSON(STORAGE.ratings, {}),
    selectedPurchaseProduct: null,
    selectedOpinionProduct: null,
    selectedRatingProduct: null,
    selectedRating: 0,
    discount: 0,
    couponApplied: false,
    governorates: FALLBACK_GOVERNORATES,
    locations: [],
    locationsLoaded: false
};

if (!Number.isFinite(state.balance)) {
    state.balance = 500;
    localStorage.setItem(STORAGE.balance, "500");
}

function readJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function $(id) {
    return document.getElementById(id);
}

function show(id) {
    const el = $(id);
    if (el) el.classList.remove("hidden");
}

function hide(id) {
    const el = $(id);
    if (el) el.classList.add("hidden");
}

function money(value) {
    return "$" + Number(value).toFixed(0);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getProduct(id) {
    return PRODUCTS.find(p => p.id === id);
}

function getAverageRating(productId) {
    const ratings = state.ratings[productId] || [];
    if (!ratings.length) return 0;
    return ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / ratings.length;
}

function ratingText(productId) {
    const avg = getAverageRating(productId);
    if (!avg) return "لا يوجد تقييم";
    return `${avg.toFixed(1)} / 5`;
}

function stars(productId) {
    const avg = Math.round(getAverageRating(productId));
    return "★".repeat(avg) + "☆".repeat(5 - avg);
}

function saveState() {
    localStorage.setItem(STORAGE.balance, String(state.balance));
    saveJSON(STORAGE.account, state.account);
    saveJSON(STORAGE.favorites, state.favorites);
    saveJSON(STORAGE.cart, state.cart);
    saveJSON(STORAGE.purchases, state.purchases);
    saveJSON(STORAGE.transactions, state.transactions);
    saveJSON(STORAGE.feedback, state.feedback);
    saveJSON(STORAGE.ratings, state.ratings);
}

function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    show("toast");
    clearTimeout(window.__regnToastTimer);
    window.__regnToastTimer = setTimeout(() => hide("toast"), 2600);
}

function updateHeader() {
    $("balance").textContent = money(state.balance);
    $("accountBalance").textContent = money(state.balance);
    $("cartCount").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);

    if ($("username")) $("username").value = state.account.username || "";
    if ($("email")) $("email").value = state.account.email || "";
}

function addTransaction(amount, text) {
    state.transactions.unshift({
        id: Date.now(),
        amount,
        text,
        date: new Date().toLocaleString("ar-SY")
    });
    state.transactions = state.transactions.slice(0, 50);
}

function showSection(sectionId) {
    [
        "homeSection",
        "productsSection",
        "purchasesSection",
        "cartSection",
        "favoritesSection",
        "accountSection",
        "contactSection"
    ].forEach(id => hide(id));

    show(sectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProducts() {
    const container = $("productsContainer");
    if (!container) return;

    const search = ($("productSearch").value || "").trim().toLowerCase();
    const category = $("categoryFilter").value;
    const sort = $("sortProducts").value;

    let products = PRODUCTS.filter(product => {
        const haystack = [
            product.name,
            product.description,
            product.categoryName,
            ...product.specs
        ].join(" ").toLowerCase();

        const matchesSearch = !search || haystack.includes(search);
        const matchesCategory = category === "all" || product.category === category;

        return matchesSearch && matchesCategory;
    });

    if (sort === "cheap") products.sort((a, b) => a.price - b.price);
    if (sort === "expensive") products.sort((a, b) => b.price - a.price);
    if (sort === "rating") products.sort((a, b) => getAverageRating(b.id) - getAverageRating(a.id));
    if (sort === "popular") products.sort((a, b) => b.popularity - a.popularity);

    container.innerHTML = products.length
        ? products.map(productCard).join("")
        : `<div class="favorite-empty">لا توجد منتجات مطابقة للبحث.</div>`;

    renderRecommendations();
}

function productCard(product) {
    const favorite = state.favorites.includes(product.id);
    const cartItem = state.cart.find(item => item.productId === product.id);
    const feedback = state.feedback.find(item => item.productId === product.id);
    const interested = feedback?.type === "interested";
    const notInterested = feedback?.type === "not-interested";

    return `
        <article class="product-card">
            <div class="product-image">${product.icon}</div>

            <div class="product-info">
                <h3>${escapeHTML(product.name)}</h3>
                <span class="product-category">${escapeHTML(product.categoryName)}</span>

                <div class="rating">
                    ⭐ ${escapeHTML(ratingText(product.id))}
                    ${getAverageRating(product.id) ? ` ${stars(product.id)}` : ""}
                </div>

                <p class="product-description">${escapeHTML(product.description)}</p>

                <div class="price">${money(product.price)}</div>

                <ul class="specs">
                    ${product.specs.map(spec => `<li>${escapeHTML(spec)}</li>`).join("")}
                </ul>

                <div class="product-actions">
                    <button
                        class="${favorite ? "favorite-active" : ""}"
                        data-action="favorite"
                        data-id="${product.id}">
                        ❤️ المفضلة
                    </button>

                    <button
                        class="buy-button"
                        data-action="buy"
                        data-id="${product.id}">
                        ⚡ شراء الآن
                    </button>

                    <button
                        data-action="cart"
                        data-id="${product.id}">
                        🛒 ${cartItem ? "في السلة" : "إضافة للسلة"}
                    </button>

                    <button
                        class="${interested ? "interested-active" : ""}"
                        data-action="interested"
                        data-id="${product.id}">
                        👍 مهتم
                    </button>

                    <button
                        class="${notInterested ? "not-interested-active" : ""}"
                        data-action="not-interested"
                        data-id="${product.id}">
                        👎 غير مهتم
                    </button>

                    <button
                        data-action="rating"
                        data-id="${product.id}">
                        ⭐ تقييم المنتج
                    </button>
                </div>
            </div>
        </article>
    `;
}

function renderRecommendations() {
    const box = $("recommendations");
    if (!box) return;

    const interestedProducts = state.feedback
        .filter(item => item.type === "interested")
        .map(item => getProduct(item.productId))
        .filter(Boolean);

    if (!interestedProducts.length) {
        hide("recommendations");
        return;
    }

    const categories = [...new Set(interestedProducts.map(p => p.category))];

    const recommendation = PRODUCTS.find(
        p => categories.includes(p.category) && !interestedProducts.some(ip => ip.id === p.id)
    );

    if (!recommendation) {
        hide("recommendations");
        return;
    }

    box.innerHTML = `
        <h3>🤖 اقتراح لك</h3>
        <p>
            بما أنك مهتم بـ ${escapeHTML(recommendation.categoryName)}،
            قد يعجبك <strong>${escapeHTML(recommendation.name)}</strong>
            بسعر ${money(recommendation.price)}.
        </p>
    `;

    show("recommendations");
}

function renderFavorites() {
    const container = $("favoritesList");
    if (!container) return;

    const products = state.favorites
        .map(id => getProduct(id))
        .filter(Boolean);

    if (!products.length) {
        container.innerHTML = `<div class="favorite-empty">❤️ لا توجد منتجات في المفضلة حالياً.</div>`;
        return;
    }

    container.innerHTML = `<div class="products">${products.map(productCard).join("")}</div>`;
}

function renderCart() {
    const container = $("cartList");
    const summary = $("cartSummary");
    const totalEl = $("cartTotal");

    if (!container) return;

    if (!state.cart.length) {
        container.innerHTML = `<div class="cart-empty">🛍️ السلة فارغة.</div>`;
        hide("cartSummary");
        return;
    }

    let total = 0;

    container.innerHTML = state.cart.map(item => {
        const product = getProduct(item.productId);
        if (!product) return "";

        const itemTotal = product.price * item.quantity;
        total += itemTotal;

        return `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div>
                        <h3>${product.icon} ${escapeHTML(product.name)}</h3>
                        <p>${money(product.price)} للقطعة</p>
                    </div>
                    <strong>${money(itemTotal)}</strong>
                </div>

                <div class="quantity-controls">
                    <button data-cart-action="plus" data-id="${product.id}">+</button>
                    <strong>${item.quantity}</strong>
                    <button data-cart-action="minus" data-id="${product.id}">−</button>
                    <button class="remove-cart" data-cart-action="remove" data-id="${product.id}">
                        حذف
                    </button>
                </div>
            </div>
        `;
    }).join("");

    totalEl.textContent = money(total);
    show("cartSummary");
}

function addToCart(productId) {
    const existing = state.cart.find(item => item.productId === productId);

    if (existing) {
        existing.quantity++;
    } else {
        state.cart.push({ productId, quantity: 1 });
    }

    saveState();
    updateHeader();
    renderCart();
    renderProducts();
    renderFavorites();
    toast("🛒 تمت إضافة المنتج إلى السلة");
}

function toggleFavorite(productId) {
    const index = state.favorites.indexOf(productId);

    if (index >= 0) {
        state.favorites.splice(index, 1);
        toast("💔 تمت إزالة المنتج من المفضلة");
    } else {
        state.favorites.push(productId);
        toast("❤️ تمت إضافة المنتج للمفضلة");
    }

    saveState();
    renderProducts();
    renderFavorites();
}

function setFeedback(productId, type) {
    const existing = state.feedback.find(item => item.productId === productId);

    if (type === "interested") {
        if (existing?.type === "interested") {
            state.feedback = state.feedback.filter(item => item.productId !== productId);
        } else {
            state.feedback = state.feedback.filter(item => item.productId !== productId);
            state.feedback.push({ productId, type: "interested" });
            toast("👍 شكراً على رأيك، سنحاول عرض المزيد من هذا");
        }
    }

    if (type === "not-interested") {
        if (existing?.type === "not-interested") {
            state.feedback = state.feedback.filter(item => item.productId !== productId);
        } else {
            state.feedback = state.feedback.filter(item => item.productId !== productId);
            state.feedback.push({ productId, type: "not-interested" });
            state.selectedOpinionProduct = productId;
            $("opinionText").value = "";
            show("opinionModal");
            return;
        }
    }

    saveState();
    renderProducts();
    renderRecommendations();
}

function openRating(productId) {
    const product = getProduct(productId);
    if (!product) return;

    state.selectedRatingProduct = productId;
    state.selectedRating = 0;

    $("ratingProductName").textContent = product.name;
    $("ratingText").value = "";
    updateRatingStars();
    show("ratingModal");
}

function updateRatingStars() {
    document.querySelectorAll("#ratingStars button").forEach(button => {
        const value = Number(button.dataset.rating);
        button.classList.toggle("active", value <= state.selectedRating);
    });
}

function saveRating() {
    const productId = state.selectedRatingProduct;
    if (!productId || !state.selectedRating) {
        toast("⭐ اختر عدد النجوم أولاً");
        return;
    }

    if (!state.ratings[productId]) state.ratings[productId] = [];

    state.ratings[productId].push({
        rating: state.selectedRating,
        comment: $("ratingText").value.trim(),
        date: new Date().toLocaleString("ar-SY")
    });

    saveState();
    hide("ratingModal");
    renderProducts();
    renderFavorites();
    toast("⭐ تم حفظ تقييمك");
}

function openPurchase(productId) {
    const product = getProduct(productId);
    if (!product) return;

    state.selectedPurchaseProduct = productId;
    state.discount = 0;
    state.couponApplied = false;

    $("purchaseProduct").innerHTML = `
        <div class="purchase-product-card">
            <h3>${product.icon} ${escapeHTML(product.name)}</h3>
            <p>السعر: ${money(product.price)}</p>
        </div>
    `;

    $("couponInput").value = "";
    $("couponMessage").textContent = "";
    $("paymentSelect").value = "now";
    $("governorateSelect").value = "";
    $("areaSelect").innerHTML = `<option value="">اختر المحافظة أولاً</option>`;
    $("areaSelect").disabled = true;
    $("locationSearch").value = "";
    $("locationSearch").disabled = true;
    $("locationCount").textContent = "";

    $("deliveryTime").textContent = "اختر المحافظة";
    updateOrderTotal();
    show("purchaseModal");

    loadGovernorates();
}

function updateOrderTotal() {
    const product = getProduct(state.selectedPurchaseProduct);
    if (!product) return;

    const total = product.price * (1 - state.discount);
    $("orderTotal").textContent = money(total);
}

function applyCoupon() {
    const code = $("couponInput").value.trim().toUpperCase();

    if (code === "REGN10") {
        state.discount = .10;
        state.couponApplied = true;
        $("couponMessage").textContent = "✅ تم تطبيق خصم 10% تجريبي.";
        updateOrderTotal();
        return;
    }

    state.discount = 0;
    state.couponApplied = false;
    $("couponMessage").textContent = code
        ? "❌ كود الخصم غير صحيح."
        : "";
    updateOrderTotal();
}

function expectedDelivery(governorateName) {
    const name = governorateName || "";

    if (name === "دمشق") return "1 - 2 يوم";
    if (name === "ريف دمشق") return "1 - 3 أيام";
    if (["القنيطرة", "درعا", "السويداء"].includes(name)) return "2 - 4 أيام";
    if (["حمص", "حماة", "طرطوس", "اللاذقية"].includes(name)) return "2 - 4 أيام";
    if (["إدلب", "حلب", "الرقة", "دير الزور", "الحسكة"].includes(name)) return "3 - 6 أيام";

    return "2 - 5 أيام";
}

function normalizeArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
}

function normalizeGovernorate(item, index) {
    return {
        id: item.id ?? item.governorateId ?? item.governorate_id ?? item.code ?? index + 1,
        name: item.name_ar ?? item.arabicName ?? item.nameArabic ?? item.name ?? item.title ?? ""
    };
}

function normalizeLocation(item, index) {
    return {
        id: item.id ?? item.localityId ?? item.locality_id ?? item.code ?? index + 1,
        name: item.name_ar ?? item.arabicName ?? item.nameArabic ?? item.name ?? item.title ?? "",
        governorateId:
            item.governorate_id ??
            item.governorateId ??
            item.governorate?.id ??
            item.governorate?.governorateId ??
            item.parentGovernorateId ??
            null,
        governorateName:
            item.governorate_name_ar ??
            item.governorateName ??
            item.governorate?.name_ar ??
            item.governorate?.name ??
            ""
    };
}

async function fetchJSON(url) {
    const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
}

async function loadGovernorates() {
    const select = $("governorateSelect");
    if (!select) return;

    select.innerHTML = `<option value="">جاري تحميل المحافظات...</option>`;

    try {
        const payload = await fetchJSON(`${API_BASE}/governorates`);
        const rows = normalizeArray(payload)
            .map(normalizeGovernorate)
            .filter(item => item.name);

        if (rows.length >= 14) {
            state.governorates = rows;
        } else {
            state.governorates = FALLBACK_GOVERNORATES;
        }
    } catch {
        state.governorates = FALLBACK_GOVERNORATES;
    }

    select.innerHTML = `
        <option value="">اختر المحافظة</option>
        ${state.governorates.map(g =>
            `<option value="${escapeHTML(String(g.id))}" data-name="${escapeHTML(g.name)}">
                ${escapeHTML(g.name)}
            </option>`
        ).join("")}
    `;
}

async function loadLocations() {
    if (state.locationsLoaded) return;

    const count = $("locationCount");
    if (count) count.textContent = "⏳ جاري تحميل جميع المناطق والنواحي والأماكن...";

    try {
        /*
         * OpenSyria has separate hierarchy endpoints:
         * governorates -> districts -> subdistricts -> localities.
         * We load all three lower levels and build the governorate relation
         * ourselves so small places are not lost just because a locality
         * does not contain a direct governorate_id.
         */
        const [districtPayload, subdistrictPayload, localityPayload] = await Promise.all([
            fetchJSON(`${API_BASE}/districts`),
            fetchJSON(`${API_BASE}/subdistricts`),
            fetchJSON(`${API_BASE}/localities`)
        ]);

        const districts = normalizeArray(districtPayload).map((item, index) => ({
            id: item.id ?? item.districtId ?? item.district_id ?? item.code ?? index + 1,
            name: item.name_ar ?? item.arabicName ?? item.nameArabic ?? item.name ?? item.title ?? "",
            governorateId:
                item.governorate_id ??
                item.governorateId ??
                item.governorate?.id ??
                item.governorate?.governorateId ??
                null
        })).filter(x => x.name);

        const subdistricts = normalizeArray(subdistrictPayload).map((item, index) => ({
            id: item.id ?? item.subdistrictId ?? item.subdistrict_id ?? item.code ?? index + 1,
            name: item.name_ar ?? item.arabicName ?? item.nameArabic ?? item.name ?? item.title ?? "",
            districtId:
                item.district_id ??
                item.districtId ??
                item.district?.id ??
                item.district?.districtId ??
                null,
            governorateId:
                item.governorate_id ??
                item.governorateId ??
                item.governorate?.id ??
                item.governorate?.governorateId ??
                null
        })).filter(x => x.name);

        const districtToGovernorate = new Map();
        districts.forEach(d => {
            if (d.id != null && d.governorateId != null) {
                districtToGovernorate.set(String(d.id), String(d.governorateId));
            }
        });

        const subdistrictToGovernorate = new Map();
        subdistricts.forEach(s => {
            let govId = s.governorateId;

            if (govId == null && s.districtId != null) {
                govId = districtToGovernorate.get(String(s.districtId)) || null;
            }

            if (s.id != null && govId != null) {
                subdistrictToGovernorate.set(String(s.id), String(govId));
            }
        });

        const localities = normalizeArray(localityPayload).map((item, index) => {
            const locality = normalizeLocation(item, index);

            const subdistrictId =
                item.subdistrict_id ??
                item.subdistrictId ??
                item.subdistrict?.id ??
                item.subdistrict?.subdistrictId ??
                null;

            const districtId =
                item.district_id ??
                item.districtId ??
                item.district?.id ??
                item.district?.districtId ??
                null;

            let governorateId = locality.governorateId;

            if (governorateId == null && subdistrictId != null) {
                governorateId = subdistrictToGovernorate.get(String(subdistrictId)) || null;
            }

            if (governorateId == null && districtId != null) {
                governorateId = districtToGovernorate.get(String(districtId)) || null;
            }

            return {
                ...locality,
                governorateId,
                subdistrictId,
                districtId
            };
        }).filter(x => x.name);

        if (!localities.length) {
            throw new Error("No localities");
        }

        state.locations = localities;
        state.locationsLoaded = true;

        if (count) {
            count.textContent =
                `✅ تم تحميل ${localities.length.toLocaleString("ar-SY")} مدينة وبلدة وقرية ومحلة`;
        }
    } catch (error) {
        console.error("REGN location loading error:", error);
        state.locations = [];
        state.locationsLoaded = true;

        if (count) {
            count.textContent =
                "تعذر تحميل بيانات الأماكن من المصدر الآن. تحقق من الإنترنت ثم أعد فتح الطلب.";
        }
    }
}

function renderLocationOptions() {
    const select = $("areaSelect");
    const searchInput = $("locationSearch");
    const count = $("locationCount");

    const gov = selectedGovernorate();

    if (!gov.id) {
        select.disabled = true;
        searchInput.disabled = true;
        select.innerHTML = `<option value="">اختر المحافظة أولاً</option>`;
        count.textContent = "";
        return;
    }

    select.disabled = false;
    searchInput.disabled = false;

    const query = (searchInput.value || "").trim().toLowerCase();

    let locations = state.locations.filter(location =>
        locationMatchesGovernorate(location, gov)
    );

    if (query) {
        locations = locations.filter(location =>
            location.name.toLowerCase().includes(query)
        );
    }

    locations.sort((a, b) => a.name.localeCompare(b.name, "ar"));

    if (!locations.length) {
        select.innerHTML = `<option value="">لا توجد نتائج بهذا البحث</option>`;
        count.textContent = "لم نجد مكاناً مطابقاً.";
        return;
    }

    select.innerHTML = `
        <option value="">اختر المنطقة / المدينة / البلدة / القرية</option>
        ${locations.map(location =>
            `<option value="${escapeHTML(String(location.id))}">
                ${escapeHTML(location.name)}
            </option>`
        ).join("")}
    `;

    count.textContent = `📍 ${locations.length.toLocaleString("ar-SY")} مكان متاح في ${gov.name}`;
}

async function governorateChanged() {
    const gov = selectedGovernorate();

    $("deliveryTime").textContent = gov.name
        ? expectedDelivery(gov.name)
        : "اختر المحافظة";

    if (!gov.id) {
        $("areaSelect").disabled = true;
        $("locationSearch").disabled = true;
        $("areaSelect").innerHTML = `<option value="">اختر المحافظة أولاً</option>`;
        $("locationCount").textContent = "";
        return;
    }

    await loadLocations();
    renderLocationOptions();
}

function confirmPurchase() {
    const product = getProduct(state.selectedPurchaseProduct);
    if (!product) return;

    const gov = selectedGovernorate();
    const locationSelect = $("areaSelect");
    const locationName =
        locationSelect.options[locationSelect.selectedIndex]?.textContent?.trim() || "";

    if (!gov.id) {
        toast("🇸🇾 اختر المحافظة أولاً");
        return;
    }

    if (!locationSelect.value) {
        toast("📍 اختر المنطقة / المدينة / البلدة / القرية");
        return;
    }

    const payment = $("paymentSelect").value;
    const total = product.price * (1 - state.discount);

    if (payment === "now" && state.balance < total) {
        toast("💰 رصيدك غير كافٍ لإتمام الطلب");
        return;
    }

    if (payment === "now") {
        state.balance -= total;
        addTransaction(-total, `شراء ${product.name}`);
    }

    const orderId = "REGN-" + Math.floor(10000 + Math.random() * 90000);

    state.purchases.unshift({
        id: orderId,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        total,
        governorateId: gov.id,
        governorate: gov.name,
        locationId: locationSelect.value,
        location: locationName,
        payment,
        status: "pending",
        createdAt: new Date().toLocaleString("ar-SY")
    });

    saveState();
    updateHeader();
    renderPurchases();
    hide("purchaseModal");

    toast(`✅ تم تأكيد الطلب ${orderId}`);
}

function renderPurchases() {
    const container = $("purchasesList");
    if (!container) return;

    if (!state.purchases.length) {
        container.innerHTML = `<div class="purchase-empty">📦 لا توجد مشتريات حتى الآن.</div>`;
        return;
    }

    container.innerHTML = state.purchases.map(order => {
        const product = getProduct(order.productId);
        const icon = product?.icon || "📦";

        let statusText = "قيد التجهيز";
        let statusClass = "pending";

        if (order.status === "delivered") {
            statusText = "تم التسليم";
            statusClass = "delivered";
        }

        return `
            <div class="purchase-item">
                <div class="purchase-header">
                    <div>
                        <h3>${icon} ${escapeHTML(order.productName)}</h3>
                        <p>رقم الطلب: <strong>${escapeHTML(order.id)}</strong></p>
                    </div>
                    <span class="purchase-status ${statusClass}">${statusText}</span>
                </div>

                <p>📍 ${escapeHTML(order.governorate)} - ${escapeHTML(order.location)}</p>
                <p>💳 ${order.payment === "cash" ? "الدفع عند الاستلام" : "تم الدفع من الرصيد"}</p>
                <p>💰 المجموع: ${money(order.total)}</p>
                <p>🕐 ${escapeHTML(order.createdAt)}</p>

                <div class="purchase-progress">
                    <span class="active"></span>
                    <span class="${order.status === "shipped" || order.status === "delivered" ? "active" : ""}"></span>
                    <span class="${order.status === "delivered" ? "active" : ""}"></span>
                    <span class="${order.status === "delivered" ? "active" : ""}"></span>
                </div>
            </div>
        `;
    }).join("");
}

function renderTransactions() {
    const container = $("transactionsList");
    if (!container) return;

    if (!state.transactions.length) {
        container.innerHTML = `<div class="muted">لا توجد عمليات حتى الآن.</div>`;
        return;
    }

    container.innerHTML = state.transactions.map(transaction => `
        <div class="transaction-item">
            <span>${escapeHTML(transaction.text)}<br><small>${escapeHTML(transaction.date)}</small></span>
            <strong class="${transaction.amount >= 0 ? "transaction-positive" : "transaction-negative"}">
                ${transaction.amount >= 0 ? "+" : ""}${money(transaction.amount)}
            </strong>
        </div>
    `).join("");
}

function handleProductAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const productId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "favorite") toggleFavorite(productId);
    if (action === "cart") addToCart(productId);
    if (action === "buy") openPurchase(productId);
    if (action === "interested") setFeedback(productId, "interested");
    if (action === "not-interested") setFeedback(productId, "not-interested");
    if (action === "rating") openRating(productId);
}

function handleCartAction(event) {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.cartAction;
    const item = state.cart.find(x => x.productId === id);

    if (!item) return;

    if (action === "plus") item.quantity++;
    if (action === "minus") item.quantity--;
    if (action === "remove") item.quantity = 0;

    state.cart = state.cart.filter(x => x.quantity > 0);

    saveState();
    updateHeader();
    renderCart();
    renderProducts();
}

function saveAccount() {
    state.account.username = $("username").value.trim();
    state.account.email = $("email").value.trim();

    saveState();
    toast("💾 تم حفظ معلومات الحساب");
}

function logout() {
    state.account = { username: "", email: "" };
    saveState();
    updateHeader();
    toast("👤 تم تسجيل الخروج من الحساب التجريبي");
}

function chargeBalance(amount) {
    state.balance += amount;
    addTransaction(amount, "شحن رصيد تجريبي");
    saveState();
    updateHeader();
    renderTransactions();
    toast(`💳 تمت إضافة ${money(amount)} تجريبياً`);
}

function initEvents() {
    $("productsButton").addEventListener("click", () => {
        showSection("productsSection");
        renderProducts();
    });

    $("purchasesButton").addEventListener("click", () => {
        showSection("purchasesSection");
        renderPurchases();
    });

    $("cartButton").addEventListener("click", () => {
        showSection("cartSection");
        renderCart();
    });

    $("favoritesButton").addEventListener("click", () => {
        showSection("favoritesSection");
        renderFavorites();
    });

    $("accountButton").addEventListener("click", () => {
        showSection("accountSection");
        renderTransactions();
    });

    $("contactButton").addEventListener("click", () => showSection("contactSection"));

    $("productsBack").addEventListener("click", () => showSection("homeSection"));
    $("purchasesBack").addEventListener("click", () => showSection("homeSection"));
    $("cartBack").addEventListener("click", () => showSection("homeSection"));
    $("favoritesBack").addEventListener("click", () => showSection("homeSection"));
    $("accountBack").addEventListener("click", () => showSection("homeSection"));
    $("contactBack").addEventListener("click", () => showSection("homeSection"));

    $("productSearch").addEventListener("input", renderProducts);
    $("categoryFilter").addEventListener("change", renderProducts);
    $("sortProducts").addEventListener("change", renderProducts);

    $("productsContainer").addEventListener("click", handleProductAction);
    $("favoritesList").addEventListener("click", handleProductAction);
    $("cartList").addEventListener("click", handleCartAction);

    $("closePurchase").addEventListener("click", () => hide("purchaseModal"));
    $("closeOpinion").addEventListener("click", () => hide("opinionModal"));
    $("cancelOpinion").addEventListener("click", () => hide("opinionModal"));
    $("closeRating").addEventListener("click", () => hide("ratingModal"));

    $("governorateSelect").addEventListener("change", governorateChanged);
    $("locationSearch").addEventListener("input", renderLocationOptions);

    $("applyCoupon").addEventListener("click", applyCoupon);
    $("confirmPurchase").addEventListener("click", confirmPurchase);

    $("sendOpinion").addEventListener("click", () => {
        const productId = state.selectedOpinionProduct;
        const text = $("opinionText").value.trim();

        if (productId) {
            state.feedback = state.feedback.filter(item => item.productId !== productId);
            state.feedback.push({
                productId,
                type: "not-interested",
                reason: text
            });
            saveState();
        }

        hide("opinionModal");
        renderProducts();
        toast("📨 تم إرسال رأيك، شكراً لك");
    });

    $("ratingStars").addEventListener("click", event => {
        const button = event.target.closest("button[data-rating]");
        if (!button) return;

        state.selectedRating = Number(button.dataset.rating);
        updateRatingStars();
    });

    $("submitRating").addEventListener("click", saveRating);

    $("saveAccount").addEventListener("click", saveAccount);
    $("logoutButton").addEventListener("click", logout);

    $("chargeButton").addEventListener("click", () => {
        $("chargeOptions").classList.toggle("hidden");
    });

    document.querySelectorAll("[data-charge]").forEach(button => {
        button.addEventListener("click", () => {
            chargeBalance(Number(button.dataset.charge));
        });
    });

    $("checkoutCart").addEventListener("click", () => {
        if (!state.cart.length) return;

        const first = state.cart[0];
        openPurchase(first.productId);

        if (state.cart.length > 1) {
            toast("🛒 سيتم تنفيذ أول منتج من السلة الآن؛ يمكنك تنفيذ البقية بعده.");
        }
    });

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) hide(modal.id);
        });
    });
}

function init() {
    initEvents();
    updateHeader();
    renderProducts();
    renderPurchases();
    renderCart();
    renderFavorites();
    renderTransactions();
}

document.addEventListener("DOMContentLoaded", init);
