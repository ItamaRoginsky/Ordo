-- CreateIndex
CREATE INDEX "Board_ownerId_idx" ON "Board"("ownerId");

-- CreateIndex
CREATE INDEX "Board_ownerId_type_idx" ON "Board"("ownerId", "type");

-- CreateIndex
CREATE INDEX "Group_boardId_idx" ON "Group"("boardId");

-- CreateIndex
CREATE INDEX "Item_groupId_idx" ON "Item"("groupId");

-- CreateIndex
CREATE INDEX "Item_parentId_idx" ON "Item"("parentId");

-- CreateIndex
CREATE INDEX "Item_scheduledDate_idx" ON "Item"("scheduledDate");

-- CreateIndex
CREATE INDEX "Item_completedAt_idx" ON "Item"("completedAt");

-- CreateIndex
CREATE INDEX "Item_isToday_idx" ON "Item"("isToday");
