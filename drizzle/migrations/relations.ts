import { relations } from "drizzle-orm/relations";
import { user, account, session, category, product, productImage, inventoryMovement, address, customerNote, order, orderItem, orderStatusHistory, trackingEvent, review, wishlist, wishlistItem, invoice, auditLog, productTag, discount, discountProduct, categoryToDiscount } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	addresses: many(address),
	customerNotes: many(customerNote),
	orders: many(order),
	reviews: many(review),
	wishlists: many(wishlist),
	auditLogs: many(auditLog),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const productRelations = relations(product, ({one, many}) => ({
	category: one(category, {
		fields: [product.categoryId],
		references: [category.id]
	}),
	productImages: many(productImage),
	inventoryMovements: many(inventoryMovement),
	orderItems: many(orderItem),
	reviews: many(review),
	wishlistItems: many(wishlistItem),
	productTags: many(productTag),
	discountProducts: many(discountProduct),
}));

export const categoryRelations = relations(category, ({many}) => ({
	products: many(product),
	categoryToDiscounts: many(categoryToDiscount),
}));

export const productImageRelations = relations(productImage, ({one}) => ({
	product: one(product, {
		fields: [productImage.productId],
		references: [product.id]
	}),
}));

export const inventoryMovementRelations = relations(inventoryMovement, ({one}) => ({
	product: one(product, {
		fields: [inventoryMovement.productId],
		references: [product.id]
	}),
}));

export const addressRelations = relations(address, ({one}) => ({
	user: one(user, {
		fields: [address.userId],
		references: [user.id]
	}),
}));

export const customerNoteRelations = relations(customerNote, ({one}) => ({
	user: one(user, {
		fields: [customerNote.userId],
		references: [user.id]
	}),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	user: one(user, {
		fields: [order.userId],
		references: [user.id]
	}),
	orderItems: many(orderItem),
	orderStatusHistories: many(orderStatusHistory),
	trackingEvents: many(trackingEvent),
	invoices: many(invoice),
}));

export const orderItemRelations = relations(orderItem, ({one}) => ({
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
	product: one(product, {
		fields: [orderItem.productId],
		references: [product.id]
	}),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({one}) => ({
	order: one(order, {
		fields: [orderStatusHistory.orderId],
		references: [order.id]
	}),
}));

export const trackingEventRelations = relations(trackingEvent, ({one}) => ({
	order: one(order, {
		fields: [trackingEvent.orderId],
		references: [order.id]
	}),
}));

export const reviewRelations = relations(review, ({one}) => ({
	product: one(product, {
		fields: [review.productId],
		references: [product.id]
	}),
	user: one(user, {
		fields: [review.userId],
		references: [user.id]
	}),
}));

export const wishlistRelations = relations(wishlist, ({one, many}) => ({
	user: one(user, {
		fields: [wishlist.userId],
		references: [user.id]
	}),
	wishlistItems: many(wishlistItem),
}));

export const wishlistItemRelations = relations(wishlistItem, ({one}) => ({
	product: one(product, {
		fields: [wishlistItem.productId],
		references: [product.id]
	}),
	wishlist: one(wishlist, {
		fields: [wishlistItem.wishlistId],
		references: [wishlist.id]
	}),
}));

export const invoiceRelations = relations(invoice, ({one}) => ({
	order: one(order, {
		fields: [invoice.orderId],
		references: [order.id]
	}),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	user: one(user, {
		fields: [auditLog.actorId],
		references: [user.id]
	}),
}));

export const productTagRelations = relations(productTag, ({one}) => ({
	product: one(product, {
		fields: [productTag.productId],
		references: [product.id]
	}),
}));

export const discountProductRelations = relations(discountProduct, ({one}) => ({
	discount: one(discount, {
		fields: [discountProduct.discountId],
		references: [discount.id]
	}),
	product: one(product, {
		fields: [discountProduct.productId],
		references: [product.id]
	}),
}));

export const discountRelations = relations(discount, ({many}) => ({
	discountProducts: many(discountProduct),
	categoryToDiscounts: many(categoryToDiscount),
}));

export const categoryToDiscountRelations = relations(categoryToDiscount, ({one}) => ({
	category: one(category, {
		fields: [categoryToDiscount.a],
		references: [category.id]
	}),
	discount: one(discount, {
		fields: [categoryToDiscount.b],
		references: [discount.id]
	}),
}));