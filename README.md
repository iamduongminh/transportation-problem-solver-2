# Transportation problem solver

### Cách sử dụng

1. Truy cập đường dẫn live demo: [https://iamduongminh.github.io/transportation-problem-solver/](https://iamduongminh.github.io/transportation-problem-solver/)
2. Nhấn nút **Nhập dữ liệu**, điền số điểm phát ($m$) và số điểm thu ($n$).
3. Nhập dữ liệu lượng cung $a_i$, lượng cầu $b_j$ và ma trận chi phí $c_{ij}$. *(Lưu ý: Chương trình hiện tại yêu cầu Tổng cung phải bằng Tổng cầu).*
   - **Mẹo nhập nhanh:** Bạn có thể bôi đen copy một dãy số cách nhau bằng dấu cách/dấu phẩy rồi click vào ô đầu tiên của Cung/Cầu hoặc hàng Chi phí, sau đó ấn Paste (`Ctrl + V`). Chương trình sẽ tự động điền các số còn lại vào các ô tương ứng.
4. Nhấn nút **Giải**.
5. Sử dụng các nút điều khiển bên dưới bảng (Play, Next, Prev, thanh trượt thời gian) để theo dõi chi tiết từng bước. Khung bên trái sẽ hiển thị lý thuyết và phép tính tương ứng cho bước đó.

---

### Các bộ test case mẫu:

Bạn có thể copy trực tiếp các chuỗi dưới đây để paste nhanh vào ô nhập liệu đầu tiên của mỗi hàng.

**Test Case 1: Bài toán cơ bản (Kích thước 4x5)**

Chuỗi để copy-paste thực thi: 

`30 40 50 20 20 35 45 25 15 2 3 5 1 4 6 1 3 4 5 4 5 2 6 3 1 2 4 5 7`

* Kích thước: Cung $m=4$, Cầu $n=5$
* Cung $a$: `30 40 50 20`
* Cầu $b$: `20 35 45 25 15`
* Ma trận chi phí $C$:
  - Hàng 1: `2 3 5 1 4`
  - Hàng 2: `6 1 3 4 5`
  - Hàng 3: `4 5 2 6 3`
  - Hàng 4: `1 2 4 5 7`

---

**Test Case 2: Bài toán cỡ lớn (Kích thước 6x5)**

Chuỗi để copy-paste thực thi: 

`10 15 20 25 30 40 25 30 40 20 25 5 8 3 6 4 2 7 9 1 5 4 3 6 8 2 7 5 4 2 9 1 9 5 3 6 6 2 8 7 3`

* Kích thước: Cung $m=6$, Cầu $n=5$
* Cung $a$: `10 15 20 25 30 40`
* Cầu $b$: `25 30 40 20 25`
* Ma trận chi phí $C$:
  - Hàng 1: `5 8 3 6 4`
  - Hàng 2: `2 7 9 1 5`
  - Hàng 3: `4 3 6 8 2`
  - Hàng 4: `7 5 4 2 9`
  - Hàng 5: `1 9 5 3 6`
  - Hàng 6: `6 2 8 7 3`

---

**Test Case 3: Bài toán suy biến**

Chuỗi để copy-paste thực thi: 

`25 35 40 30 25 45 3 1 7 2 4 6 5 2 3`

* Kích thước: Cung $m=3$, Cầu $n=3$
* Cung $a$: `25 35 40`
* Cầu $b$: `30 25 45`
* Ma trận chi phí $C$:
  - Hàng 1: `3 1 7`
  - Hàng 2: `2 4 6`
  - Hàng 3: `5 2 3`
