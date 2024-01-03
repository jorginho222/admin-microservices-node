import {Column, Entity, ManyToMany, PrimaryGeneratedColumn, JoinTable} from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    title: string

    @Column()
    image: string

    @Column({default: 0})
    likes: number

    @Column({default: 0})
    approxPrice: number

    @Column({nullable: true})
    exchangeTags: string

    @JoinTable({name: 'product_permuted_products'})
    @ManyToMany(() => Product, (product) => product.permutedProducts, {nullable: true})
    permutedProducts: Array<Product>
}