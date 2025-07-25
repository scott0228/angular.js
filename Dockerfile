# 使用官方 Node.js 14 作為基礎映像
# docker build --platform linux/amd64 -t angularjs-test-env .
# docker run --rm angularjs-test-env npx karma start karma-jqlite.conf.js --single-run 
FROM node:14-bullseye

# 安裝 Google Chrome 及必要的相依套件
# 參考: https://www.server-world.info/en/note?os=Debian_10&p=chrome&f=1
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    # 安裝 Chrome 以及在無頭 (headless) 環境中執行所需的函式庫
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 yarn.lock (或 package-lock.json)
# 這樣可以利用 Docker 的快取機制，只有在依賴項目變更時才重新安裝
COPY package.json yarn.lock ./

# 根據 lock 檔案安裝依賴項目
RUN yarn install --frozen-lockfile

# 複製整個專案的程式碼到工作目錄
COPY . .

# 設定 Chrome 的環境變數，以便 Karma 找到它
ENV CHROME_BIN=/usr/bin/google-chrome-stable

# 設定預設的執行指令
CMD ["npx", "karma", "start", "karma-jqlite.conf.js", "--single-run", "--browsers=ChromeHeadless"]
