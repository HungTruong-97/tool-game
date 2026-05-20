# tool-game

Tool tự động hóa trình duyệt bằng Node.js và [Playwright](https://playwright.dev/), dùng để thao tác trên các trang nhà cái, thu thập thông tin cổng nạp tiền qua ngân hàng (số tài khoản, tên ngân hàng, QR) và lưu vào file JSON trong thư mục `data/`.

## Mục tiêu dự án

Thu thập và lưu trữ thông tin tài khoản ngân hàng / mã QR hiển thị tại màn hình nạp tiền, lặp qua nhiều cổng thanh toán trên cùng một nhà cái. Khi tài khoản bị khóa (block), tool tạo tài khoản mới và chạy lại từ đầu.

## Các trang hỗ trợ (chọn 1 trong 3)

| # | URL | Ghi chú |
|---|-----|---------|
| 1 | [https://m.66win33.com/Account/Login](https://m.66win33.com/Account/Login) | Trang đăng nhập mobile 33win |
| 2 | [https://ok9-okvip.info/](https://ok9-okvip.info/) | Trang chủ OK9 |
| 3 | [https://789bet-2026.live/](https://789bet-2026.live/) | Trang chủ 789BET |

Cấu hình URL qua biến môi trường `START_URL` (xem `.env.example`).

## Quy trình nghiệp vụ

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Bước 1–3    │ ──► │ Bước 4–6     │ ──► │ Bước 7–8    │
│ Vào site,   │     │ Nạp tiền,    │     │ Lưu thông   │
│ đăng ký,    │     │ chọn cổng,   │     │ tin NH,     │
│ vào nạp tiền│     │ đọc QR/TK    │     │ lặp cổng    │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                  │
                    ┌──────────────┐              │
                    │ Bước 9       │ ◄────────────┘
                    │ Acc bị block │   (còn cổng / còn acc)
                    │ → tạo acc mới│
                    └──────────────┘
```

### Bước 1 — Truy cập trang

Mở một trong ba URL ở bảng trên (theo `START_URL` hoặc cấu hình trong script).

### Bước 2 — Đăng ký tài khoản

Tự động điền form đăng ký và tạo tài khoản mới trên trang đã chọn.

### Bước 3 — Vào phần nạp tiền

Điều hướng tới mục **Nạp tiền** / **Deposit** trên giao diện sau khi đăng nhập.

### Bước 4 — Chọn nạp qua ngân hàng

Chọn phương thức **nạp tiền qua ngân hàng**. Trang thường hiển thị **5–10 cổng** (gateway) khác nhau, mỗi cổng là một kênh chuyển khoản riêng.

### Bước 5 — Chọn số tiền và mở từng cổng

- Chọn mức số tiền cần nạp.
- Lần lượt mở từng cổng trong danh sách để xem thông tin thanh toán tương ứng.

### Bước 6 — Đọc thông tin hiển thị

Sau khi chọn cổng, màn hình có thể hiển thị (tùy cổng):

- Số tài khoản ngân hàng
- Tên chủ tài khoản / tên ngân hàng
- Mã QR chuyển khoản (một số cổng chỉ hiển thị QR)

Tool dùng Playwright đọc nội dung DOM (và có thể chụp ảnh QR nếu cần).

### Bước 7 — Lưu thông tin ngân hàng

Ghi lại dữ liệu mỗi cổng vào `data/` (JSON), ví dụ:

```json
{
  "site": "https://ok9-okvip.info/",
  "account": "user_xxx",
  "gateway": "Cổng 3",
  "amount": "500000",
  "bankName": "",
  "accountNumber": "",
  "accountHolder": "",
  "qrImagePath": "",
  "scrapedAt": "2026-05-21T00:00:00.000Z"
}
```

Text lấy từ trang web — không gán giá trị mặc định thay cho nội dung API/trang.

### Bước 8 — Lặp các cổng còn lại

Quay lại **bước 5**: đổi cổng khác, lặp bước 6–7 cho đến khi đã duyệt hết danh sách cổng của lần nạp hiện tại.

### Bước 9 — Tài khoản bị block

Khi tài khoản bị khóa / chặn:

1. Ghi nhận trạng thái (acc, site, thời điểm).
2. **Đăng ký tài khoản mới** (quay lại bước 2).
3. Chạy lại toàn bộ quy trình từ bước 3.

## Dữ liệu đầu ra

| File / thư mục | Nội dung |
|----------------|----------|
| `data/banks.json` | Danh sách thông tin ngân hàng / QR theo cổng |
| `data/accounts.json` | Lịch sử tài khoản (active / blocked) |
| `data/scraped.json` | Demo / log chạy thử (script mẫu hiện tại) |

Các file `*.json` trong `data/` không được commit (xem `.gitignore`).

## Yêu cầu kỹ thuật

- Node.js **>= 18** (dùng `.nvmrc`: `nvm use`)
- Playwright + Chromium

## Cài đặt

```bash
nvm use
npm install
npx playwright install chromium
```

## Chạy

```bash
# Demo scrape trang mẫu (example.com)
npm start

# Mở browser để debug UI
HEADLESS=false npm start

# Chọn nhà cái (ví dụ OK9)
START_URL=https://ok9-okvip.info/ HEADLESS=false npm start
```

## Cấu trúc mã nguồn

```
src/
  index.js      # entry — sẽ mở rộng theo quy trình 9 bước
  browser.js    # launch browser, withBrowserPage()
  storage.js    # loadData() / saveData() → thư mục data/
data/           # export JSON (gitignore *.json)
```

## Trạng thái triển khai

| Bước | Mô tả | Trạng thái |
|------|--------|------------|
| 1–9 | Quy trình nghiệp vụ (mô tả trên) | 📋 Đã mô tả — chờ implement |
| — | Demo Playwright + lưu JSON | ✅ `npm start` |

Các bước 2–9 cần selector và luồng UI riêng cho từng site (66win / OK9 / 789BET); triển khai dần trong `src/` theo từng URL.

## Ghi chú phát triển

- Dùng `page.locator()`, `page.click()`, `page.fill()`, `waitForSelector()` cho thao tác form và menu.
- Dùng `saveData('banks.json', payload)` sau mỗi cổng; `loadData()` để nối tiếp phiên chạy.
- Chạy `HEADLESS=false` khi chỉnh selector hoặc xử lý captcha / popup thủ công.
- Mỗi site có thể cần file script riêng: `src/sites/ok9.js`, `src/sites/789bet.js`, v.v.
