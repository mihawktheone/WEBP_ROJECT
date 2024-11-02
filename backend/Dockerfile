# ใช้ Node.js เป็น Base Image
FROM node:18

# ติดตั้ง Bun
RUN curl -fsSL https://bun.sh/install | bash

# ตั้งค่า PATH ให้ใช้ bun ได้
ENV PATH="/root/.bun/bin:$PATH"

# ตั้งค่า Working Directory ใน Container
WORKDIR /app

# คัดลอกไฟล์ทั้งหมดไปยัง Container
COPY . .

# ติดตั้ง Dependencies ด้วย Bun
RUN bun install

# เปิดพอร์ตที่ใช้ (เช่น 3000)
EXPOSE 3000

# สั่งให้รันแอปพลิเคชันด้วย Bun
CMD ["bun", "run", "start"]
